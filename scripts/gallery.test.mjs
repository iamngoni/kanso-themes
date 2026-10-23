// Tests for scripts/gallery.mjs. Run with:
//   node --test scripts/gallery.test.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const repo = resolve(new URL("..", import.meta.url).pathname);
const commit = "5b05cd5bbb8ce0946b699d7d9b758f125acb924b";
const generatedAt = "2026-10-23T12:00:00Z";

function copyRepo() {
  const dir = mkdtempSync(join(tmpdir(), "kanso-gallery-"));
  cpSync(repo, dir, {
    recursive: true,
    filter: (path) =>
      !path.includes("/.git/") &&
      !path.includes("/gallery/index.json") &&
      !path.includes("/gallery/versions.json") &&
      !path.includes("/gallery/icon-themes") &&
      !path.includes("/tools/gallery-sign/target/"),
  });
  return dir;
}

function build(dir, extra = []) {
  execFileSync("node", [join(dir, "scripts/gallery.mjs"), "--root", dir, "--out", join(dir, "gallery"), "--source-commit", commit, "--generated-at", generatedAt, ...extra], { stdio: "pipe" });
}

function read(file) {
  return readFileSync(file, "utf8");
}

test("the builder is deterministic", () => {
  const a = copyRepo();
  const b = copyRepo();
  try {
    build(a);
    build(b);
    for (const file of ["index.json", "versions.json"]) {
      assert.equal(read(join(a, "gallery", file)), read(join(b, "gallery", file)));
    }
    for (const bundle of execFileSync("ls", [join(a, "gallery", "icon-themes")]).toString().trim().split("\n")) {
      assert.deepEqual(
        readFileSync(join(a, "gallery", "icon-themes", bundle)),
        readFileSync(join(b, "gallery", "icon-themes", bundle)),
        bundle,
      );
    }
  } finally {
    rmSync(a, { recursive: true, force: true });
    rmSync(b, { recursive: true, force: true });
  }
});

test("the serial increments once and versions change only with content", () => {
  const dir = copyRepo();
  try {
    build(dir);
    const first = JSON.parse(read(join(dir, "gallery", "versions.json")));
    assert.equal(first.serial, 1);
    build(dir);
    const second = JSON.parse(read(join(dir, "gallery", "versions.json")));
    assert.equal(second.serial, 2);
    for (const id of Object.keys(first.themes)) {
      assert.equal(second.themes[id].version, first.themes[id].version, id);
    }
    // Change one theme's bytes.
    const theme = join(dir, "andromeda.json");
    writeFileSync(theme, read(theme) + "\n");
    build(dir);
    const third = JSON.parse(read(join(dir, "gallery", "versions.json")));
    assert.equal(third.serial, 3);
    assert.equal(third.themes.andromeda.version, 3);
    assert.notEqual(third.themes.andromeda.hash, second.themes.andromeda.hash);
    assert.equal(third.themes["ayu-dark"].version, second.themes["ayu-dark"].version);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("check accepts the committed index and rejects a changed file", () => {
  const dir = copyRepo();
  try {
    build(dir);
    execFileSync("node", [join(dir, "scripts/gallery.mjs"), "--root", dir, "--out", join(dir, "gallery"), "--check"], { stdio: "pipe" });
    const theme = join(dir, "andromeda.json");
    writeFileSync(theme, read(theme) + "\n");
    assert.throws(() =>
      execFileSync("node", [join(dir, "scripts/gallery.mjs"), "--root", dir, "--out", join(dir, "gallery"), "--check"], { stdio: "pipe" }),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
