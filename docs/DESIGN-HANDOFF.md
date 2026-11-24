# Design handoff

How to set up the visual design so it drops straight into `card.json`.

## The core rule

Your design frame and `card.json` share one coordinate system. If your frame is 1080 × 1350 and a photo sits at X 100, Y 400 with width 420 and height 500, the layer in `card.json` is

```json
{ "type": "image", "src": "assets/photo-1.jpg", "x": 100, "y": 400, "w": 420, "h": 500 }
```

The engine scales the whole card to fit any screen, so you always work in design pixels.

## Frame setup

1. One frame per page, each **1080 × 1350** (4:5, fits phones and laptops well). For a tall phone-only card use 1080 × 1920 and change `stage.width` and `stage.height` to match.
2. Name frames `page-1`, `page-2` and so on.
3. Keep important content 60 px in from every edge.

## What to export, and how

Think in two buckets.

**Flatten what never moves.** Background color, patterns, paper texture, decorative borders. Hide every interactive layer, then export the frame as one image `page-1-bg.jpg`. Use it as the page `backgroundImage`.

**Export separately what moves or gets touched.** Photos, stickers, ornaments, anything that floats, sways, pops in or wiggles on hover.

| Kind | Format | Settings |
| --- | --- | --- |
| Photos | JPG | 2x, about 80% quality |
| Stickers and illustrations with transparency | PNG | 2x |
| Simple vector shapes | SVG | default |
| Flattened page background | JPG | 2x |

Name files lowercase with hyphens, for example `photo-dog.jpg`, `sticker-tree.png`. Use the same name for the layer `id` in `card.json`.

**Text.** Either export it as an image (exact look, not editable later) or recreate it as a `text` layer (crisp at every size, editable, needs the font in `theme.fontLinks`). Headlines with fancy lettering are usually best as images. The letter on the inside page is best as text.

## Reading the numbers

### Figma

1. Select a layer that sits directly inside the frame.
2. The right panel shows **X, Y, W, H** relative to the frame. Copy those.
3. Rotation shows next to the angle icon. Figma counts counterclockwise and CSS counts clockwise, so flip the sign. Figma 6° becomes `"rotate": -6`.
4. For rotated layers the X and Y can drift a little. Get them close, then fine-tune in edit mode.

### Canva

1. Select an element, then **Position** in the toolbar, then the **Arrange** tab.
2. Canva shows **Width, Height, X, Y** and **Rotate**. Copy them.
3. Make sure the design size is 1080 × 1350 px (Resize → Custom size) so the numbers match.

## Fine-tuning visually

You don't need perfect numbers from the design file. Get things roughly placed, then

1. Run `python3 tools/cards.py serve`.
2. Open the card link with `?edit` at the end.
3. Drag to move. Drag the blue corner to resize (Shift keeps the shape). Arrow keys nudge 1 px, Shift + arrow nudges 10 px. Type exact values in the panel.
4. Press **Download** and replace `years/<year>/card.json` with the downloaded file.

## Handoff checklist

- [ ] Frame size matches `stage.width` and `stage.height`
- [ ] Every moving piece exported on its own
- [ ] Static background flattened per page
- [ ] Files named lowercase-with-hyphens
- [ ] X, Y, W, H and rotation noted for each piece (or a screenshot with the panel visible)
- [ ] Palette hex codes and font names written down
