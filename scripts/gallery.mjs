#!/usr/bin/env node
// Builds the signed theme gallery from the theme files themselves:
// `gallery/index.json`, `gallery/versions.json` and one deterministic
// `gallery/icon-themes/<id>.tar.gz` per icon theme.
//
// The reviewed metadata lives in `gallery/catalog.json` (families,
// `min_kanso`, revocations). Versions and the serial are generated here, so
// a theme PR never edits a reviewed file and a bot never edits a theme.
//
// Usage:
//   node scripts/gallery.mjs [--root DIR] [--out DIR] [--previous FILE]
//        [--source-commit SHA] [--generated-at RFC3339] [--check | --verify-only]
//
// Exit status 1 on any validation failure. Node 20+.

import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { execSync } from "node:child_process";

const SCHEMA = 1;
const MAX_COLOR_BYTES = 256 * 1024;
const MAX_BUNDLE_BYTES = 16 * 1024 * 1024;
const MAX_SVG_BYTES = 128 * 1024;
const MAX_PREVIEWS = 8;

// Options that take no value. Anything else reads the next argument.
const FLAGS = new Set(["check", "verify-only"]);

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    if (FLAGS.has(key)) {
      out[key] = true;
      continue;
    }
    if (i + 1 >= argv.length || argv[i + 1].startsWith("--")) fail(`--${key} needs a value`);
    out[key] = argv[i + 1];
    i += 1;
  }
  return out;
}

function fail(message) {
  console.error(`gallery: ${message}`);
  process.exit(1);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function isSha(text) {
  return /^[0-9a-f]{64}$/.test(text);
}

function isName(text) {
  return (
    typeof text === "string" &&
    text.length <= 64 &&
    /^[a-z0-9][a-z0-9_-]*$/.test(text)
  );
}

function isSpdx(text) {
  return (
    typeof text === "string" &&
    text.trim().length > 0 &&
    text.length <= 64 &&
    /[A-Za-z]/.test(text) &&
    /^[A-Za-z0-9 .+()-]+$/.test(text)
  );
}

function isHttpsUrl(text) {
  try {
    const url = new URL(text);
    return url.protocol === "https:" && url.hostname.length > 0 && !url.username && !url.password;
  } catch {
    return false;
  }
}

function isSvgPath(path) {
  return (
    path.length <= 200 &&
    path.toLowerCase().endsWith(".svg") &&
    path.split("/").every((part) => /^[A-Za-z0-9._-]+$/.test(part) && part !== "." && part !== "..")
  );
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function walk(dir, root = dir, files = []) {
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    const meta = lstatSync(full);
    if (meta.isSymbolicLink()) fail(`${relative(root, full)} is a link`);
    if (meta.isDirectory()) {
      walk(full, root, files);
    } else if (meta.isFile()) {
      files.push({ path: relative(root, full).split(sep).join("/"), full, size: meta.size });
    } else {
      fail(`${relative(root, full)} isn't a plain file`);
    }
  }
  return files;
}

function familyOf(id) {
  const suffixes = [
    "-light-high-contrast",
    "-dark-high-contrast",
    "-light",
    "-dark",
  ];
  for (const suffix of suffixes) {
    if (id.endsWith(suffix) && id.length > suffix.length) {
      return id.slice(0, -suffix.length);
    }
  }
  return id;
}

// A minimal, deterministic ustar writer: sorted entries, fixed mtime,
// uid/gid 0, mode 0644 for files and 0755 for folders, no link entries.
function tarHeader({ path, mode, size, type }) {
  const header = Buffer.alloc(512, 0);
  const write = (text, offset, length) => {
    header.write(text, offset, length, "utf8");
  };
  if (path.length > 100) fail(`bundle path too long: ${path}`);
  write(path, 0, 100);
  write(mode.toString(8).padStart(7, "0"), 100, 8);
  write("0000000", 108, 8);
  write("0000000", 116, 8);
  write(size.toString(8).padStart(11, "0"), 124, 12);
  write("00000000000", 136, 12);
  write("        ", 148, 8);
  write(type, 156, 1);
  write("ustar\0", 257, 6);
  write("00", 263, 2);
  write("", 265, 32);
  write("", 297, 32);
  write("0000000", 329, 8);
  write("0000000", 337, 8);
  write("", 345, 155);
  let sum = 0;
  for (const byte of header) sum += byte;
  write(sum.toString(8).padStart(6, "0"), 148, 6);
  header[154] = 0;
  header[155] = 0x20;
  return header;
}

function tar(entries) {
  const chunks = [];
  for (const entry of entries) {
    if (entry.type === "5") {
      chunks.push(tarHeader({ path: entry.path, mode: 0o755, size: 0, type: "5" }));
      continue;
    }
    chunks.push(tarHeader({ path: entry.path, mode: 0o644, size: entry.bytes.length, type: "0" }));
    chunks.push(entry.bytes);
    const pad = (512 - (entry.bytes.length % 512)) % 512;
    if (pad) chunks.push(Buffer.alloc(pad, 0));
  }
  chunks.push(Buffer.alloc(1024, 0));
  return gzipSync(Buffer.concat(chunks), { level: 9 });
}

function iconBundle(root, id) {
  const folder = join(root, "icon-themes", id);
  const files = walk(folder);
  if (!files.length) fail(`${id} has no files`);
  const manifest = {
    files: files.map((file) => ({
      path: `${id}/${file.path}`,
      sha256: sha256(readFileSync(file.full)),
      size: file.size,
    })),
  };
  const entries = [];
  const seenDirs = new Set([id]);
  for (const file of manifest.files) {
    const parts = file.path.split("/");
    for (let i = 1; i < parts.length; i += 1) {
      const dir = parts.slice(0, i).join("/");
      if (!seenDirs.has(dir)) {
        seenDirs.add(dir);
        entries.push({ type: "5", path: dir });
      }
    }
    entries.push({
      type: "0",
      path: file.path,
      bytes: readFileSync(join(folder, file.path.slice(id.length + 1))),
    });
  }
  entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const manifestBytes = Buffer.from(JSON.stringify(manifest, null, 2) + "\n");
  const all = [{ type: "0", path: "manifest.json", bytes: manifestBytes }, ...entries];
  // `manifest.json` sorts after `catppuccin-icons/…`; sort again so both
  // the manifest and the tree are in one stable order.
  all.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const bundle = tar(all);
  if (bundle.length > MAX_BUNDLE_BYTES) fail(`${id}'s bundle is too large`);
  return { bundle, manifest: manifestBytes, files };
}

function main() {
  const options = args(process.argv.slice(2));
  const root = resolve(options.root || join(process.cwd()));
  const out = resolve(options.out || join(root, "gallery"));
  if (options["verify-only"] || options.check) {
    check(root, out, join(out, "index.json"));
    console.log("gallery: the index matches every file it names");
    return;
  }
  const catalogPath = join(root, "gallery", "catalog.json");
  const catalog = readJson(catalogPath);
  const colorIndex = readJson(join(root, "index.json"));
  const iconIndex = readJson(join(root, "icon-themes", "index.json"));
  const previousPath = resolve(options.previous || join(root, "gallery", "versions.json"));
  const previous = existsSync(previousPath) ? readJson(previousPath) : { serial: 0, themes: {} };
  const previousIndexPath = join(root, "gallery", "index.json");
  const previousIndex = existsSync(previousIndexPath) ? readJson(previousIndexPath) : null;
  const serial = Number(previous.serial || 0) + 1;
  if (!Number.isInteger(serial) || serial < 1) fail("the serial isn't a positive integer");
  const generatedAt =
    options["generated-at"] || new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const sourceCommit =
    options["source-commit"] ||
    process.env.GITHUB_SHA ||
    (() => {
      try {
        return execSync("git rev-parse HEAD", { cwd: root }).toString().trim();
      } catch {
        fail("pass --source-commit (not a git checkout)");
      }
    })();
  if (!/^[0-9a-f]{40}$/.test(sourceCommit)) fail("source_commit isn't a commit hash");

  mkdirSync(join(out, "icon-themes"), { recursive: true });

  const revoked = (catalog.revoked || []).map((entry) => {
    if (!isName(entry.id)) fail(`revoked id ${entry.id} isn't valid`);
    if (!entry.reason || !entry.reason.trim()) fail(`${entry.id} is revoked without a reason`);
    if (!entry.since || Number.isNaN(Date.parse(entry.since))) fail(`${entry.id} has a bad date`);
    return { id: entry.id, reason: entry.reason, since: entry.since };
  });
  const revokedIds = new Set(revoked.map((entry) => entry.id));

  const themes = [];
  const versions = { ...(previous.themes || {}) };
  const names = new Map();
  const ids = new Set();

  const catalogEntry = (id) => (catalog.themes && catalog.themes[id]) || {};

  for (const theme of colorIndex.themes) {
    const id = theme.file.replace(/\.json$/, "");
    if (!isName(id)) fail(`color theme ${id} isn't a valid id`);
    if (ids.has(id)) fail(`duplicate id ${id}`);
    ids.add(id);
    if (revokedIds.has(id)) continue;
    if (names.has(theme.name.toLowerCase())) fail(`duplicate name ${theme.name}`);
    names.set(theme.name.toLowerCase(), id);
    if (previousIndex) {
      const before = previousIndex.themes.find((entry) => entry.id === id);
      if (before && before.name !== theme.name) {
        fail(`${id}'s name changed from ${before.name} to ${theme.name}; use a new id`);
      }
    }
    const file = join(root, theme.file);
    const bytes = readFileSync(file);
    if (bytes.length > MAX_COLOR_BYTES) fail(`${theme.file} is too large`);
    const full = readJson(file);
    const meta = catalogEntry(id);
    const hash = sha256(bytes);
    const version =
      previous.themes?.[id]?.hash === hash ? previous.themes[id].version : serial;
    versions[id] = { version, hash };
    const entry = {
      id,
      kind: "color",
      family: meta.family || familyOf(id),
      version,
      name: theme.name,
      appearance: theme.appearance,
      author: theme.author || full.author || "",
      license: theme.license || full.license || "",
      source: full.source || theme.source || "",
      description: full.description || theme.description || "",
      min_kanso: meta.min_kanso || catalog.min_kanso || "0.8.4",
      file: { path: theme.file, sha256: hash, size: bytes.length },
      colors: theme.colors,
    };
    requireFields(entry);
    themes.push(entry);
  }

  for (const theme of iconIndex.themes) {
    const id = theme.folder;
    if (!isName(id)) fail(`icon theme ${id} isn't a valid id`);
    if (ids.has(id)) fail(`duplicate id ${id}`);
    ids.add(id);
    if (revokedIds.has(id)) continue;
    if (names.has(theme.name.toLowerCase())) fail(`duplicate name ${theme.name}`);
    names.set(theme.name.toLowerCase(), id);
    const meta = catalogEntry(id);
    const { bundle, files } = iconBundle(root, id);
    const hash = sha256(bundle);
    const version =
      previous.themes?.[id]?.hash === hash ? previous.themes[id].version : serial;
    versions[id] = { version, hash };
    const svgs = files
      .filter((file) => file.path.toLowerCase().endsWith(".svg"))
      .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
      .slice(0, MAX_PREVIEWS);
    const preview = [];
    for (const svg of svgs) {
      const bytes = readFileSync(svg.full);
      if (bytes.length > MAX_SVG_BYTES) fail(`${id}/${svg.path} is too large`);
      const path = `icon-themes/${id}/${svg.path}`;
      if (!isSvgPath(path)) fail(`${path} isn't a valid preview path`);
      preview.push({ path, sha256: sha256(bytes), size: bytes.length });
    }
    const entry = {
      id,
      kind: "icons",
      version,
      name: theme.name,
      author: theme.author || "",
      license: theme.license || "",
      source: theme.source || "",
      description: theme.description || "",
      min_kanso: meta.min_kanso || catalog.min_kanso || "0.8.4",
      bundle: {
        path: `gallery/icon-themes/${id}.tar.gz`,
        sha256: hash,
        size: bundle.length,
      },
      preview,
    };
    if (meta.family) entry.family = meta.family;
    requireFields(entry);
    themes.push(entry);
    if (!options.check) {
      const bundlePath = join(out, "icon-themes", `${id}.tar.gz`);
      writeFileSync(bundlePath, bundle);
    }
  }

  themes.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const index = {
    schema: SCHEMA,
    serial,
    generated_at: generatedAt,
    source_commit: sourceCommit,
    signing_key_id: process.env.KANSO_THEMES_KEY_ID || "unset",
    themes,
    revoked,
  };
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "versions.json"), JSON.stringify({ serial, themes: versions }, null, 2) + "\n");
  writeFileSync(join(out, "index.json"), JSON.stringify(index, null, 2) + "\n");
  console.log(
    `gallery: serial ${serial}, ${themes.length} themes, ${revoked.length} revoked`,
  );
}

function requireFields(entry) {
  if (!entry.name) fail(`${entry.id} has no name`);
  if (!isSpdx(entry.license)) fail(`${entry.id} has no SPDX licence`);
  if (!isHttpsUrl(entry.source)) fail(`${entry.id} has no HTTPS source`);
  if (!/^\d+\.\d+\.\d+/.test(entry.min_kanso)) fail(`${entry.id} has no min_kanso`);
  if (!Number.isInteger(entry.version) || entry.version < 1) fail(`${entry.id} has no version`);
}

// Verifies the generated index against the files it names. `out` is where
// the generated bundles live (the repository's `gallery/` when publishing,
// a temp folder when validating); colour themes and previews come from
// `root`.
function check(root, out, indexPath) {
  const index = readJson(indexPath);
  for (const theme of index.themes) {
    const pins = [theme.file, theme.bundle, ...(theme.preview || [])];
    for (const pin of pins) {
      if (!pin) continue;
      // A file the index pins must carry a real size: Kanso's parser
      // requires one and refuses zero.
      if (!Number.isInteger(pin.size) || pin.size <= 0) {
        fail(`${pin.path} has no size in the index`);
      }
      if (!isSha(pin.sha256)) fail(`${pin.path} has no SHA-256 in the index`);
      const file = pin.path.startsWith("gallery/")
        ? join(out, pin.path.slice("gallery/".length))
        : join(root, pin.path);
      const bytes = readFileSync(file);
      if (sha256(bytes) !== pin.sha256 || bytes.length !== pin.size) {
        fail(`${pin.path} doesn't match the index`);
      }
    }
  }
  for (const revoked of index.revoked || []) {
    if (!isName(revoked.id)) fail(`revoked id ${revoked.id} isn't valid`);
  }
}

main();
