# Kanso themes

Color themes for [Kanso](https://github.com/iamngoni/kanso), the Markdown
notes app. Each theme is one JSON file. Kanso compiles the themes in this
folder in, and reads more from the `themes` folder in its data folder
(Settings › Themes › Open Folder), so you can try a theme by dropping its file
there: Kanso picks up the change within a couple of seconds. Icon themes are
in [`icon-themes/`](#icon-themes).

Three themes are in use at once, and you choose each in
Settings › Themes:

- the **UI theme** colors the sidebar, the note list, menus and every control;
- the **syntax theme** colors the Markdown source in the editor, and code in it;
- the **preview theme** colors the rendered note.

Syntax and preview follow the UI theme unless you pick otherwise. With
*Switch between a light and a dark theme with the system* on, you pick one
light and one dark UI theme, and Kanso switches between them with macOS.

## The format

A theme file follows [`schema/kanso-theme-v1.json`](schema/kanso-theme-v1.json)
(JSON Schema 2020-12). The smallest theme gives a name, an appearance and
three colors; Kanso derives every other color from them, shading text until
it reads on the surfaces it sits on:

```json
{
  "$schema": "https://raw.githubusercontent.com/iamngoni/kanso-themes/main/schema/kanso-theme-v1.json",
  "schema_version": 1,
  "name": "Night Pine",
  "author": "You",
  "license": "MIT",
  "appearance": "dark",
  "ui": { "editor": "#1B2420", "text": "#E6EFE9", "accent": "#7FC8A9" }
}
```

Top-level keys:

| Key | |
|---|---|
| `name` | Shown under the theme's card. Unique among themes. Required. |
| `appearance` | `"light"` or `"dark"`. Required. |
| `author`, `license`, `source`, `description` | Who made the palette, its SPDX license (e.g. `MIT`), where it comes from, a sentence about it. |
| `schema_version` | `1`. |
| `ui`, `syntax`, `preview` | The colors, below. Every key is optional except `ui.editor`, `ui.text` and `ui.accent`. |

Colors are `#RRGGBB`, or `#RRGGBBAA` with an alpha. A translucent UI or
preview color is painted over the editor surface.

### `ui`

| Key | Colors |
|---|---|
| `editor` | The editor and preview pane: the main surface. **Required.** |
| `text` | Body text on every surface. **Required.** |
| `accent` | Focus rings, the caret, the Active status. **Required.** |
| `app` | Behind everything: the window's top band. |
| `sidebar` | The sidebar of notebooks and tags. |
| `list` | The note list. |
| `elevated` | Menus, popovers and the command palette. |
| `fill` | Chips, banners and other quiet fills. |
| `text_secondary` | Text that is read but not primary: note previews, details. |
| `text_muted` | Quiet text: times, counts, hints. |
| `divider` | Lines between panes and rows; control borders. |
| `link` | Link text in the UI. |
| `row_active`, `row_hover` | The selected note in the list, and one under the pointer. |
| `sidebar_active`, `sidebar_hover` | The same in the sidebar. |
| `hover`, `selected` | Menu items and ghost buttons under the pointer; a selected ghost button. |
| `active_line` | The editor line with the cursor, when line numbers show. |
| `button`, `button_text` | Primary buttons and their text. |
| `success`, `warning`, `danger` | Statuses (Completed, On hold), errors and destructive actions. |
| `selection` | Selected text in the editor; usually translucent. |
| `caret` | The editor's caret. |

### `syntax`

Each value is a color, or an object with any of `color`, `font_style`
(`"normal"` or `"italic"`) and `font_weight` (100–900):

```json
"syntax": {
  "heading": { "color": "#88C0D0", "font_weight": 700 },
  "comment": { "color": "#616E88", "font_style": "italic" },
  "keyword": "#81A1C1"
}
```

Headings and strong text stay bold, and emphasis italic, when a theme gives
them only a color.

| Key | Colors |
|---|---|
| `text` | Plain Markdown text. |
| `heading` | Heading text. |
| `block_marker` | Heading `#` and quote `>` markers. |
| `marker` | Inline markers: `*`, backticks, code fences, table pipes, link brackets. |
| `list_marker` | List bullets and numbers. |
| `task` | Task boxes, `[ ]` and `[x]`. |
| `hr` | Horizontal rules. |
| `quote` | Quoted text. |
| `link`, `url` | Link text, and link destinations. |
| `code`, `code_block` | Inline code, and code blocks without a language. |
| `emphasis`, `strong` | *Emphasis* and **strong** text. |
| `front_matter`, `html`, `escape` | YAML front matter, HTML blocks, backslash escapes. |
| `comment`, `comment_doc` | Code: comments, documentation comments. |
| `keyword`, `string`, `string_special` | Code: keywords, strings, regular expressions and the like. |
| `function`, `type`, `type_constructor` | Code: function names, types, constructors and variants. |
| `number`, `boolean`, `constant` | Code: literals and constants. |
| `variable`, `variable_special`, `property`, `attribute` | Code: names. |
| `tag`, `label`, `operator`, `punctuation`, `bracket`, `embedded` | Code: the rest. |

The code keys are tree-sitter capture names, as in Zed's themes.

### `preview`

| Key | Colors |
|---|---|
| `text`, `heading`, `link` | Body text, headings, links. |
| `quote` | Quoted text and the bar beside it. |
| `task_done` | Finished tasks, and list bullets and numbers: text that steps back. Defaults to the secondary text, not the quote color. |
| `border` | Table borders and horizontal rules. |
| `code_background`, `code_text` | Code blocks, and their text when they have no language. |
| `inline_code_background`, `inline_code_text` | Inline code. |
| `table_header_background` | A table's header row. |
| `selection` | Selected text. |

Code blocks in the preview take the preview theme's `syntax` colors.

### What is derived

Anything left out is worked out from what is given: the panes are set back
from `editor` (darker in a dark theme, a step toward the text in a light
one), secondary and quiet text are mixed from `text` and `editor`, links and
buttons come from `accent`, and syntax and preview colors from the UI
colors. When a syntax or preview theme is paired with another UI theme, its
colors are shaded until they read on that theme's surfaces.

## Importing

`Import Theme…` on the Themes page, or `kanso theme import <path>`, converts:

- a **theme package**: an npm-style package (`package.json` with
  `"theme": true`, `ui.css`, `syntax.css`, `preview.css`) as a folder or
  `.tgz`, and, as well as it can, an older single-part UI, syntax or preview
  package;
- a **Zed** theme family (`.json`, one Kanso theme per theme in it).

The result lands in the themes folder as an ordinary theme file to edit.

## Contributing a theme

1. Add `your-theme.json` here, with `author`, `license` and `source` saying
   where the palette comes from; only add palettes whose license allows it.
2. Keep it legible: body text at 4.5:1 on every surface, secondary and
   quiet text at 3:1, every syntax color at 3:1 on the editor.
   `kanso theme check your-theme.json` lists anything that falls short.
3. Run `scripts/check.sh`: it checks every theme against the schema, rewrites
   `index.json` and renders `thumbnails/your-theme.png`.
4. Open a pull request with the thumbnail.

`kanso theme fmt <files>` writes a file in the canonical key order, and
`kanso theme schema` prints the schema the app reads.

## Icon themes

`icon-themes/` holds icon themes. Each is a folder: one JSON file following
[`icon-themes/schema/kanso-icon-theme-v1.json`](icon-themes/schema/kanso-icon-theme-v1.json),
the SVGs it names and its LICENSE. An icon theme redraws Kanso's icons;
Kanso draws each one in the color theme's text color, so any icon theme goes
with any color theme, and an icon a theme leaves out stays Kanso's own.

Two are Kanso's own: **Lucide**, the icons Kanso draws without an icon
theme, and **Phosphor**. Every other theme here is complete too: it draws
all of Kanso's icons, from the toolbar, menus and Settings to the sidebar and
the library's own (notebooks, Inbox, Journal, pins, tags, the board and the
graph), so choosing one changes the whole app, not only the notebooks.

Twelve began as [Zed](https://zed.dev) file-icon themes converted with
`kanso icon-theme import`. Those drew only folders, files and attachments,
so each keeps its own folder, file and attachment art and takes the rest of
Kanso's icons from an open icon set drawn in the same style (the same weight,
corners and fill): Iconoir for Catppuccin, Fluent's filled icons for Charmed,
MingCute's for FantastIcons, IntelliJ's own icons for the JetBrains pair,
Material Symbols for Material and Monospace, Carbon for Min, Phosphor for
Kokedera and the Phosphor Icons Theme, and Tabler for Symbols and
Serendipity. Where the chosen set has no icon for something, a second set in
the same style draws it, and the theme's LICENSE files name every set it uses.
The rest are whole open icon families.

Every theme's icons are drawn in one color, the color theme's text, so a
theme converted from a colorful set keeps its shapes and drops its colors.

To use one, choose it in Settings › Themes › Icon theme. To try your own,
drop its folder into the `icon-themes` folder in Kanso's data folder
(Settings › Themes › Icon theme files › Open Folder), or choose
**Import…** there and pick the folder.

`scripts/check.sh` reads every icon theme with `kanso icon-theme check` and
validates it against the schema. `icon-themes/index.json` lists them; Kanso
has no index command for icon themes yet, so it is written from each theme's
JSON.

| Theme | Icons | Icons by | License | Source |
|---|---|---|---|---|
| Bootstrap Icons | 334 | The Bootstrap Authors; Microsoft (Fluent UI System Icons) | MIT | https://icons.getbootstrap.com |
| Catppuccin Icons | 334 | Catppuccin; Luca Burgio (Iconoir); Paweł Kuna (Tabler Icons) | MIT | https://github.com/catppuccin/zed-icons |
| Charmed Icons | 334 | littensy, jmesrje; Microsoft (Fluent UI System Icons); Google (Material Symbols); The Bootstrap Authors | MIT AND Apache-2.0 | https://github.com/jmesrje/zed-charmed-icons |
| FantastIcons | 334 | Caio Landgraf; MingCute Design; Microsoft (Fluent UI System Icons) | MIT AND Apache-2.0 | https://github.com/caiolandgraf/fantasticons-zed |
| Fluent Regular | 334 | Microsoft (Fluent UI System Icons); The Bootstrap Authors | MIT | https://github.com/microsoft/fluentui-system-icons |
| Hugeicons | 334 | Hugeicons | MIT | https://hugeicons.com |
| IconPark | 334 | ByteDance | Apache-2.0 | https://iconpark.oceanengine.com |
| JetBrains Icons | 334 | JetBrains (IntelliJ Platform classic icons); Zeeshan Ahmad; The Bootstrap Authors; Microsoft (Fluent UI System Icons); Google (Material Symbols) | Apache-2.0 AND MIT | https://github.com/ziishaned/zed-jetbrains-icons |
| JetBrains New UI Icons | 334 | JetBrains (IntelliJ Platform New UI icons); ankddev; Paweł Kuna (Tabler Icons) | Apache-2.0 AND MIT | https://github.com/ankddev/zed-jetbrains-newui-icons |
| Kokedera Icons | 334 | Florian Mühlhans; Phosphor Icons | MIT | https://github.com/cappuccinotogo/kokedera-icons-extension-zed |
| Lucide | none, Kanso’s own | Lucide Contributors | ISC | https://lucide.dev |
| Material Icon Theme | 334 | Zed Industries; Google (Material Symbols); The Bootstrap Authors | MIT AND Apache-2.0 | https://github.com/zed-extensions/material-icon-theme |
| Material Symbols Outlined | 334 | Google (Material Symbols); The Bootstrap Authors | Apache-2.0 AND MIT | https://fonts.google.com/icons |
| Min Icons | 334 | Phillip Bronzel; IBM (Carbon); Paweł Kuna (Tabler Icons) | MIT AND Apache-2.0 | https://github.com/phibr0/zed-min-theme |
| MingCute Line | 334 | MingCute Design | Apache-2.0 | https://www.mingcute.com |
| Monospace Icons | 334 | Isheunopa Ralph Mhonde; Google (Material Symbols); The Bootstrap Authors | Apache-2.0 AND MIT | https://github.com/irmhonde/monospace-icon-theme |
| Phosphor | 363 | Phosphor Icons (Helena Zhang and Tobias Fried) | MIT | https://phosphoricons.com |
| Phosphor Bold | 334 | Phosphor Icons (Helena Zhang and Tobias Fried) | MIT | https://phosphoricons.com |
| Phosphor Duotone | 334 | Phosphor Icons (Helena Zhang and Tobias Fried) | MIT | https://phosphoricons.com |
| Phosphor Icons Theme | 334 | Theo Luciano; Phosphor Icons | MIT | https://github.com/theoluciano/phosphor-icons-theme |
| Phosphor Thin | 334 | Phosphor Icons (Helena Zhang and Tobias Fried) | MIT | https://phosphoricons.com |
| Serendipity Icons | 334 | Nguyen Dang Vinh; Paweł Kuna (Tabler Icons) | MIT | https://github.com/meocoder31099/Serendipity-Icon-Theme-Zed |
| Symbols | 334 | Joan Garcia; Paweł Kuna (Tabler Icons) | MIT | https://github.com/joangarciaa-dev/zed-symbols |
| TDesign Icons | 334 | TDesign (Tencent) | MIT | https://tdesign.tencent.com/design/icon-en |

Only icons whose license allows sharing them are here: MIT, Apache-2.0 or
ISC. Sets under GPL, CC BY or CC BY-SA, or with a license that forbids
redistributing them as an icon set, aren't.

## Licenses

Each theme carries its palette's license in its `license` field, with the
palette's home in `source`. The palettes here are MIT or Apache-2.0 licensed; the
files themselves are MIT, like Kanso.

Each icon theme carries its icons' license in its `license` field (an SPDX
expression when it draws from more than one set) and in its folder: a
converted theme keeps the Zed extension's LICENSE, and the license of every
icon set it draws from is beside it as LICENSE-<SET> (LICENSE-ICONS or
LICENSE-APACHE where the extension already carried one).

## Theme gallery

Kanso's gallery is the same themes, published as a signed catalog: a new
theme, or a fix to one, reaches Kanso without a release. Everything in this
section is optional for a theme PR; only the owner publishes.

### Files

```
gallery/
  catalog.json            reviewed: families, min_kanso, revoked
  versions.json           generated: serial and per-theme versions
  index.json              generated, signed, committed
  index.json.sig          generated, signed, committed
  icon-themes/<id>.tar.gz generated bundles, committed
  trusted-keys.txt        public keys only
  kanso-commit.txt        the Kanso commit whose parsers CI runs
scripts/gallery.mjs       the builder
tools/gallery-sign/       the signer and verifier
```

### Adding or changing a theme

1. Add or edit `<id>.json` (a color theme at the repository root) or
   `icon-themes/<id>/` and its row in
   `icon-themes/index.json`, exactly as for a normal theme PR.
2. Run `node scripts/gallery.mjs` to check the catalog builds. The builder
   derives ids, names, hashes, sizes, versions and bundles from the files;
   do not edit `gallery/index.json` or `gallery/versions.json` by hand.
3. `scripts/check.sh` still runs Kanso's parser, contrast checks and icon
   path rules; the `Validate themes` workflow runs them again from the
   pinned Kanso commit in `gallery/kanso-commit.txt`.

A color theme's `name` is immutable once published (Kanso selects by name):
renaming one needs a new id. `id` is the file stem and is immutable too.

### Families, minimum Kanso and revocation

`gallery/catalog.json` is the reviewed metadata the theme files do not
carry:

```json
{
  "min_kanso": "0.8.4",
  "themes": {
    "nord": { "family": "nord", "min_kanso": "0.8.4" }
  },
  "revoked": [
    { "id": "old-palette", "reason": "Withdrawn by its author.", "since": "2026-10-01T00:00:00Z" }
  ]
}
```

A family with exactly one light and one dark theme is one paired card in
Kanso; more than two variants stay separate cards under the same family.
`min_kanso` makes Kanso show but not install an entry that needs a newer app.

Revocation is a separate, reviewed change: add the id to `revoked` with a
reason and publish. Kanso removes an installed unedited copy and falls back
if it was selected. A revoked copy the person edited is disabled and
unselected, not deleted, until that case is decided (issue #49, question 4).
Absence from the catalog is not revocation: an installed theme that merely
disappears stays installed and is labelled "Not in the gallery".

### Publishing

`Publish gallery` runs after `Validate themes` succeeds on `main`:

1. **build** (read-only, no secret) runs the builder and uploads the index,
   bundles and versions.
2. **sign** runs in the protected `gallery` environment, with a reviewer
   required and `contents: read`, builds `tools/gallery-sign`, signs the
   exact index bytes, verifies against `gallery/trusted-keys.txt`, and
   uploads the signature. If the secret is absent it skips cleanly.
3. **publish** has `contents: write`, no secret, re-verifies every bundle
   hash against the signed index, and commits `gallery/` with `[skip ci]`.

Every action is pinned to a commit. The publish job uses the workflow's
built-in `GITHUB_TOKEN`; main is not protected, and a `GITHUB_TOKEN` push does
not start another workflow, which is wanted here. It cannot forge a
signature.

### The owner's setup (done)

The key and the `gallery` environment already exist; there is nothing left
to generate.

- The public key is in `gallery/trusted-keys.txt` and in Kanso's
  `crates/kanso-gallery/keys/themes-trusted-keys.txt`.
- The `gallery` environment requires a reviewer and deploys only from
  `main`. It holds `KANSO_THEMES_SIGNING_KEY`, and nothing else does.
- The secret was made with `kanso-release keygen` from Kanso, which prints
  the base64 of a 32-byte Ed25519 seed. `gallery-sign` reads exactly that
  format, so it needs no conversion. Do not run `gallery-sign keygen` again
  unless rotating: a new key would not be trusted by a shipped Kanso.

The next successful validation run signs and publishes the index.

### Rotation

Generate a new key, add its public half to both trusted-key lists, ship a
Kanso release that trusts both, then replace `KANSO_THEMES_SIGNING_KEY` with
the new secret. Once the oldest supported Kanso trusts the new key, remove
the old line from both lists. Never reuse the app-update key: the two key
lists are separate.
