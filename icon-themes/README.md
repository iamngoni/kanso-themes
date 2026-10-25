# Kanso icon themes

Icon themes for [Kanso](https://github.com/iamngoni/kanso), the Markdown
notes app. Each theme is a folder: one JSON file and the SVGs it names.
Kanso compiles the themes in this folder in, and reads more from the
`icon-themes` folder in its data folder (Settings › Icon Themes › Icon theme
files › Open Folder), so you can try a theme by dropping its folder there:
Kanso picks up the change within a couple of seconds.

The icon theme draws every icon in Kanso: the sidebar, the note list, the
toolbar, menus, the palette and every control, the component library's own
(a checkbox's check, a menu's arrow) included. Choose one in
Settings › Icon Themes, or with **Change icon theme…** in the
palette; the new icons show at once, in every window. An icon a theme
leaves out stays Kanso's own, icon by icon.

These are built in:

- **Lucide**, Kanso's own icons ([Lucide](https://lucide.dev), ISC);
- **Phosphor**, the regular weight of [Phosphor](https://phosphoricons.com)
  (MIT), drawn for every icon Kanso has, with its own notebook, Inbox and
  Journal icons and 34 more icons for notebooks;

these, converted from Zed icon themes, each keeping its own folder, file and
attachment art and drawing the rest of Kanso from an open set in the same
style, so every one of them is complete:

- **Catppuccin Icons** (Catppuccin; Luca Burgio (Iconoir); Paweł Kuna (Tabler Icons), MIT): Catppuccin's folder and file icons from the Zed extension, with Iconoir's thin round-capped outlines for the rest of Kanso.
- **Charmed Icons** (littensy, jmesrje; Microsoft (Fluent UI System Icons); Google (Material Symbols); The Bootstrap Authors, MIT AND Apache-2.0): littensy's soft filled Charmed Icons for folders and files, with Fluent's filled icons for the rest of Kanso.
- **FantastIcons** (Caio Landgraf; MingCute Design; Microsoft (Fluent UI System Icons), MIT AND Apache-2.0): FantastIcons' flat filled folders and files, with MingCute's filled icons for the rest of Kanso.
- **JetBrains Icons** (JetBrains (IntelliJ Platform classic icons); Zeeshan Ahmad; The Bootstrap Authors; Microsoft (Fluent UI System Icons); Google (Material Symbols), Apache-2.0 AND MIT): JetBrains IntelliJ's classic flat icons wherever the IDE has one, with Bootstrap's filled icons, and a few of Fluent's and Material's, for the rest.
- **JetBrains New UI Icons** (JetBrains (IntelliJ Platform New UI icons); ankddev; Paweł Kuna (Tabler Icons), Apache-2.0 AND MIT): The JetBrains IDEs' New UI icons wherever the IDE has one, with Tabler's icons redrawn at the same 1px weight for the rest.
- **Kokedera Icons** (Florian Mühlhans; Phosphor Icons, MIT): Kokedera's mossy folders and files, with Phosphor's filled icons, as soft and rounded, for the rest of Kanso.
- **Material Icon Theme** (Zed Industries; Google (Material Symbols); The Bootstrap Authors, MIT AND Apache-2.0): The Material Icon Theme's folders and files, with Google's filled Material Symbols for the rest of Kanso.
- **Min Icons** (Phillip Bronzel; IBM (Carbon); Paweł Kuna (Tabler Icons), MIT AND Apache-2.0): The Min theme's thin, chamfered Chalice icons for folders and files, with IBM's Carbon icons, as thin and square, for the rest of Kanso.
- **Monospace Icons** (Isheunopa Ralph Mhonde; Google (Material Symbols); The Bootstrap Authors, Apache-2.0 AND MIT): Firebase Studio's Monospace folders and files, with Google's filled, rounded Material Symbols for the rest of Kanso.
- **Phosphor Icons Theme** (Theo Luciano; Phosphor Icons, MIT): Phosphor's regular icons with the folders and files Theo Luciano's Zed extension picks.
- **Serendipity Icons** (Nguyen Dang Vinh; Paweł Kuna (Tabler Icons), MIT): Serendipity's tiny square file and folder icons, with Tabler's icons redrawn thin with square corners for the rest of Kanso.
- **Symbols** (Joan Garcia; Paweł Kuna (Tabler Icons), MIT): Miguel Solorio's Symbols for folders and files, with Tabler's matching 2px round-stroked icons for the rest of Kanso.

and these, whole open icon families:

- **Bootstrap Icons** (The Bootstrap Authors; Microsoft (Fluent UI System Icons), MIT): Bootstrap's outline icons: crisp, compact 16px glyphs, with Fluent's outlines for the animals Bootstrap doesn't draw.
- **Fluent Regular** (Microsoft (Fluent UI System Icons); The Bootstrap Authors, MIT): Microsoft's Fluent icons in their regular weight: light, rounded outlines in the style of Windows 11.
- **Hugeicons** (Hugeicons, MIT): Hugeicons' free stroke-rounded icons: friendly 1.5px outlines with soft corners.
- **IconPark** (ByteDance, Apache-2.0): ByteDance's IconPark outline icons: chunky, rounded strokes that stay bold at small sizes.
- **Material Symbols Outlined** (Google (Material Symbols); The Bootstrap Authors, Apache-2.0 AND MIT): Google's Material Symbols in their outlined style: clean, even outlines on Material's grid.
- **MingCute Line** (MingCute Design, Apache-2.0): MingCute's line icons: crisp, rounded outlines with a light, even stroke.
- **Phosphor Bold** (Phosphor Icons (Helena Zhang and Tobias Fried), MIT): Phosphor's bold weight: heavy, rounded strokes that read at a glance.
- **Phosphor Duotone** (Phosphor Icons (Helena Zhang and Tobias Fried), MIT): Phosphor's duotone icons: regular strokes over a soft tinted fill.
- **Phosphor Thin** (Phosphor Icons (Helena Zhang and Tobias Fried), MIT): Phosphor's thin weight: hairline strokes for a quiet, airy interface.
- **TDesign Icons** (TDesign (Tencent), MIT): Tencent's TDesign icons: clean geometric outlines on a 24px grid.

Each folder's LICENSE files carry the license of every set its icons come
from.

## The format

A theme file follows
[`schema/kanso-icon-theme-v1.json`](schema/kanso-icon-theme-v1.json) (JSON
Schema 2020-12). The smallest theme gives a name and one icon:

```
icon-themes/
  sketch/                the theme's ID: lowercase letters, digits, - and _
    sketch.json          one .json file
    icons/search.svg     the SVGs, anywhere inside the folder
    icons/notebook.svg
    icons/planet.svg
```

```json
{
  "$schema": "https://raw.githubusercontent.com/iamngoni/kanso-themes/main/icon-themes/schema/kanso-icon-theme-v1.json",
  "schema_version": 1,
  "name": "Sketch",
  "author": "You",
  "license": "CC0-1.0",
  "icons": { "search": "icons/search.svg" },
  "library": { "notebook": "icons/notebook.svg" },
  "notebook_icons": {
    "planet": { "file": "icons/planet.svg", "label": "Planet", "keywords": "space orbit" }
  }
}
```

Top-level keys:

| Key | |
|---|---|
| `name` | Shown under the theme's card. Unique among icon themes. Required. |
| `author`, `license`, `source`, `description` | Who drew the icons, their SPDX license (e.g. `MIT`), where they come from, a sentence about them. |
| `schema_version` | `1`. |
| `icons`, `library`, `notebook_icons` | The icons, below. Every one is optional. |

A path is relative to the theme's folder, with `/` between its parts, each
of letters, digits, `.`, `-` and `_`, and ends in `.svg`. One file can draw
several icons.

### `icons`

Kanso's UI icons by name, which are [Lucide](https://lucide.dev/icons)'s:
`search`, `settings`, `close`, `check`, `chevron-down`, `notebook`, `pin`,
`trash` and the rest. The schema lists every one
Kanso draws, and a name it doesn't draw is an error, so a typo doesn't pass
silently.

### `library`

The library's own icons, which a theme can draw apart from the UI icon
they show by default. A slot left out falls back to the one in brackets,
which the theme may draw in turn:

| Key | Draws |
|---|---|
| `notebook` | A notebook without an icon of its own (`notebook`). |
| `notebook-open` | One opened in the sidebar to show the ones inside it (`library.notebook`). |
| `notebook-locked` | A locked notebook, in place of its icon (`lock`). |
| `fold-closed`, `fold-open` | The arrow beside a notebook or tag level, folded and open (`chevron-right`, `chevron-down`). |
| `inbox`, `journal`, `templates` | The Inbox, the Journal and the Templates notebooks (`library.notebook`). |
| `note` | A note in the palette (`file-text`). |
| `note-pinned`, `note-locked`, `note-shared`, `note-published` | The marks on a note (`pin`, `lock`, `users`, `globe`). |
| `tag` | A tag (`hash`). |
| `all-notes`, `pinned`, `recent`, `tasks`, `shared`, `trash` | The places in the sidebar and the palette (`file-text`, `pin`, `clock`, `circle-check`, `users`, `trash`). |
| `notebooks`, `tags` | The collapsed sidebar's notebooks and tags (`notebook`, `hash`). |
| `board`, `calendar`, `graph` | The board, the journal calendar and the graph (`square-kanban`, `calendar-days`, `waypoints`). |
| `attachment-pdf`, `attachment-image`, `attachment-audio` | Kept for attachments; nothing draws them yet (`file`, `image`, `music`). |

### `notebook_icons`

More icons for a notebook's **Change Icon…** picker, in a section named
after the theme, found by their names, labels, keywords and the theme's
name. Each is a path, or `{ "file", "label", "keywords" }`. A notebook keeps
one as `<theme>/<icon>` and syncs it; under another icon theme, or on a
device without the theme, it shows the default notebook icon.

## Drawing the icons

Kanso draws an icon as a shape in the theme's text color, so an icon theme
matches every light and dark color theme:

- **One color.** Only the shape matters: colors in the file are ignored, and
  a multicolored icon shows as a single-color silhouette.
- Draw on a square `viewBox`, such as `0 0 24 24`. Strokes and fills both
  work; `stroke="currentColor"` is fine.

## What Kanso reads

A theme's folder comes from anyone, so it is read with care: the JSON is
at most 512 KB and names at most 2,000 icons; an SVG is at most 128 KB, and
a theme at most 16 MB of them; a path never leaves the folder (no `..`, no
absolute paths, and a link that leads out isn't followed); Kanso reads up to
64 themes. Nothing is fetched: a theme is only ever local files.

A theme file that can't be read (not JSON, an unknown key, a name that's
taken) is skipped, and Settings › Icon Themes lists it with the reason. An SVG
that can't be used (missing, too large, not an SVG) is listed too, and the
rest of the theme still draws.

## Importing

**Import…** under Settings › Icon Themes › Icon theme files, **Import Icon
Theme…** in the palette, or `kanso icon-theme import <path>`, converts:

- a **Zed** icon theme: an extension's `icon_themes/*.json`, its folder, or
  its `.tar.gz`;
- a **theme package** (an npm-style package folder, or the `.tgz` its
  registry serves) carrying one, in an `icon_themes/` folder or named by
  `iconTheme` in its `package.json` (Zed's format or Kanso's);
- a **Kanso icon theme** folder, checked and copied.

A Zed theme's folder icons become `notebook` and `notebook-open`, its
chevrons `fold-closed` and `fold-open`, its default file icon `note`, its
named folders the special notebooks where the names line up (`inbox`,
`journal`, `templates`, `trash`, `tags`), and its PDF, image and audio file
icons the attachment slots (by the theme's own `file_suffixes`, else by
Zed's default suffixes, as Zed does). Everything else is left to Kanso's
own icons. A theme file to convert may be up to 8 MB; what Kanso writes is
held to the limits above.

The result lands in the icon themes folder as an ordinary theme folder to
edit, with only the SVGs it uses (each checked as above) and every license
file the source has (`LICENSE`, `LICENSE-MIT`, `COPYING`…). Its author and
license are the ones `extension.toml` or `package.json` give, its `source`
the repository or homepage they name. The import says what mapped and what
was left out; importing again updates the same folder. A theme with no icon
Kanso can use isn't imported, and variants drawing the same shapes in other
colors (a light and a dark one, say) are imported once, since Kanso draws
icons in the text color anyway. An archive is unpacked by Kanso itself,
regular files only, at most 64 MB and 20,000 files, and never outside its
own temporary folder.

`kanso icon-theme check <folder>` reads a theme as Kanso does and lists
anything wrong, and `kanso icon-theme schema` prints the schema.

## Contributing a theme

1. Add `your-theme/` here, with its JSON, its SVGs (only the ones it names)
   and its LICENSE, and `author`, `license` and `source` saying where the
   icons come from; only add icons whose license allows it.
2. Run `kanso icon-theme check icon-themes/your-theme`, and
   `cargo test -p kanso-app icon_themes`: every SVG in the folder has to be
   used.
3. Open a pull request with a screenshot of Settings › Icon Themes.

## Licenses

Each theme carries its icons' license in its `license` field and its folder's
LICENSE files, one for every icon set it draws from: Lucide is ISC, Phosphor
is MIT (© 2023 Phosphor Icons), and the rest are MIT or Apache-2.0. The theme
files themselves are MIT.
