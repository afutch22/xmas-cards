# card.json reference

Every card is one `card.json` in its year folder. All positions and sizes are in **design pixels** (the same numbers as your Figma or Canva frame). Paths are relative to the year folder, for example `assets/photo-1.jpg`.

`years/_template/card.json` is a complete working example.

## Top level

| Field | What it does |
| --- | --- |
| `year` | Folder name. Set by the tool. |
| `engine` | Engine version this card was built with. Set by the tool. |
| `meta` | Link preview and browser tab text. |
| `theme` | Fonts, page background, CSS variables. |
| `opener` | How the card opens. |
| `effects` | Things running around the card (snow, lights). |
| `music` | Optional background audio. |
| `stage` | Card size and default background. |
| `pages` | The pages of the card, each a list of layers. |
| `nav` | Optional custom labels for the page arrows, `{ "prev": "‹", "next": "›" }`. |

## meta

| Field | Example | Notes |
| --- | --- | --- |
| `title` | `"Happy Holidays from Us"` | Tab title and preview title |
| `description` | `"Tap to open."` | Preview text under the title |
| `image` | `"assets/preview.jpg"` | Preview image, 1200 × 630 ideal |
| `url` | `"https://you.github.io/xmas-cards/years/2026/"` | Live URL. Needed so iMessage can find the image. |

Run `python3 tools/cards.py stamp <year>` after changing `meta`.

## theme

| Field | Example |
| --- | --- |
| `page` | `"radial-gradient(ellipse at top, #2a5a40, #10281b)"` (any CSS background behind the card) |
| `fontLinks` | `["https://fonts.googleapis.com/css2?family=Caveat&display=swap"]` |
| `stylesheets` | `["style.css"]` (this year's own CSS, loaded last so it overrides the engine. The template's `style.css` lists every class you can restyle.) |
| `fonts.display` | `"'Lobster', serif"` |
| `fonts.hand` | `"'Caveat', cursive"` |
| `fonts.body` | `"Georgia, serif"` |
| `vars` | `{ "xc-tape": "rgba(255,170,190,.8)", "xc-paper": "#fffdf7", "xc-ui": "#fff" }` |

To use a font file instead of Google Fonts, put it in `assets/`, add a small CSS file with an `@font-face` rule, and list that CSS file in `fontLinks`.

## opener

```json
"opener": { "type": "envelope", "options": { "color": "#b8282f" } }
```

`type` is a file name in `engine/openers/`. Each opener lists its options at the top of its file.

**envelope** options `color`, `liner` (any CSS background), `paper`, `seal`, `sealColor`, `to`, `stamp`, `stampColor`, `ink`, `hint`, `hintColor`.

**flip** options `image`, `title`, `color`, `textColor`, `inside`, `hint`.

**none** shows the card immediately.

## effects

A list. Each item is a name or `{ "type": name, "options": {...} }`.

| type | options |
| --- | --- |
| `snow` | `count`, `color`, `size`, `speed`, `wind`, `glyph` (e.g. `"❄"`), `front` |
| `twinkle-lights` | `colors`, `spacing`, `sag`, `wire`, `speed` |
| `sparkle-cursor` | `glyphs`, `colors`, `every`, `size` |

## music

```json
"music": { "src": "assets/song.mp3", "volume": 0.5, "loop": true, "autoplay": true, "icon": "♪" }
```

Browsers only allow sound after a tap, so it starts when the card opens. Use `null` for no music. Use music you have the rights to share.

## stage

| Field | Default | Notes |
| --- | --- | --- |
| `width`, `height` | 1080, 1350 | Must match your design frame |
| `radius` | 16 | Corner rounding in design px |
| `background` | `"#fff"` | Default page background (any CSS background) |
| `backgroundImage` | none | Default page image |
| `clip` | true | `false` lets stickers hang over the card edge |
| `shadow` | true | `false` removes the drop shadow |

## pages

```json
"pages": [
  { "name": "front", "background": "#fbf4e6", "backgroundImage": "assets/page-1-bg.jpg", "layers": [ ... ] }
]
```

`backgroundImage` wins over a gradient in `background`. CSS sizes inside backgrounds can use `cqw` (1cqw = 1% of card width) so patterns scale with the card.

## layers

Layers stack in list order (later is on top) unless you set `z`.

### Shared fields

| Field | Example | Notes |
| --- | --- | --- |
| `id` | `"photo-dog"` | Shown in edit mode. Match your export file name. |
| `type` | `"image"` | `image`, `text`, `box`, `html` |
| `x`, `y` | 100, 400 | Top-left corner |
| `w`, `h` | 420, 500 | Leave `h` out on text to size automatically |
| `rotate` | -6 | Degrees, clockwise |
| `z` | 10 | Stacking order |
| `enter` | `"pop"` | Entrance each time the page shows. `pop`, `drop`, `fade`, `rise`, `spin` |
| `delay` | 0.4 | Seconds before the entrance starts. Stagger these. |
| `animate` | `"float"` | Looping motion. `float`, `sway`, `bob`, `twinkle`, `spin`, `pulse`, `jiggle` |
| `speed` | 3 | Seconds per loop |
| `hover` | `"lift"` | On mouse hover. `lift`, `grow`, `wiggle` |
| `href` | `"https://..."` | Makes the layer a link |
| `className` | `"my-class"` | Extra CSS classes |
| `style` | `{ "opacity": 0.8 }` | Escape hatch. Any CSS in camelCase. |

### image

| Field | Notes |
| --- | --- |
| `src` | Path to the file |
| `alt` | Description for screen readers |
| `frame` | `polaroid`, `tape`, `round`, `sticker`, `shadow`, `contain` |
| `caption` | Handwritten caption (shows under polaroids) |
| `fit` | `cover` (default, crops to fill) or `contain` |

### text

| Field | Notes |
| --- | --- |
| `text` | Use `\n` for line breaks |
| `size` | Font size in design px |
| `font` | `display`, `hand`, `body`, or any CSS font-family |
| `color`, `align`, `weight`, `lineHeight` | As in CSS |
| `letterSpacing` | In em, e.g. `0.05` |
| `shadow` | `true` or a CSS text-shadow |

### box

A colored shape. `fill` (any CSS background) and `radius` (design px, or `"50%"` for a circle).

### html

`html` holds raw HTML for anything the other types can't do.
