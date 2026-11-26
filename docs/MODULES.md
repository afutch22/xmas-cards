# Extending the engine

The engine is meant to grow one small piece per year. Each piece is one file.

## Ground rules

1. **Change the shared `engine/` folder, never a published year's copy.** Published years keep the engine they shipped with so they never break.
2. **One module, one file.** Its CSS lives inside it as a string and gets injected with `injectCSS`.
3. **Year-specific looks go in `card.json`,** not in the engine. If you are about to hard-code a color in a module, make it an option instead.
4. **Document options at the top of the file.** That comment is the module's manual.
5. **Respect reduced motion.** Every module receives `reducedMotion`. Shorten or skip big movement when it's true.
6. After a change, bump `ENGINE_VERSION` in `engine/engine.js` and run `python3 tools/cards.py sync-engine <draft-year>`.

## Openers

File `engine/openers/<name>.js`. Used as `"opener": { "type": "<name>", "options": {...} }`.

```js
import { el, injectCSS, wait } from "../util.js";

export default async function giftBox({ root, card, options, reducedMotion }) {
  injectCSS("xc-opener-gift-box", CSS);
  const scene = el("div", "xc-gift-scene");
  scene.innerHTML = `<button class="xc-gift">🎁</button>`;
  root.append(scene);

  // 1. wait for the tap
  await new Promise((resolve) => scene.querySelector("button").addEventListener("click", resolve, { once: true }));
  // 2. play the animation
  scene.classList.add("is-open");
  await wait(reducedMotion ? 200 : 900);
  // 3. start fading out, then return. The card appears the moment this resolves.
  scene.classList.add("is-leaving");
  setTimeout(() => scene.remove(), 800);
}

const CSS = `...`;
```

The contract is simple. Show something, wait for a tap, animate, then resolve the promise. The engine opens the card when the promise resolves. If an opener throws, the card opens anyway.

Arguments the engine passes.

| Name | What it is |
| --- | --- |
| `root` | The `#card-root` element. Append your scene here. |
| `card` | The card object. `card.width`, `card.height`, `card.el`, `card.show(i)` |
| `options` | `opener.options` from card.json |
| `config` | The whole card.json |
| `reducedMotion` | True if the viewer asked for less motion |

## Effects

File `engine/effects/<name>.js`. Used in `"effects": [{ "type": "<name>", "options": {...} }]`.

```js
export default function confetti({ options, reducedMotion }) {
  // set up, append to document.body
  // return a function that removes everything
  return () => {};
}
```

Use the `xc-fx` class for full-screen layers (fixed, not clickable). z-index guide: 0 behind the card, 3 above the background but below the opener, 30 above everything.

## Layer add-ons

File `engine/layers/<name>.js`, loaded by the engine when a layer asks for it (today `correct` loads `correction.js`). It receives the layer's elements, the layer config and the card, and should wait for `card.revealed` before animating.

## Frames, entrances, loops, hovers

These are CSS classes in `engine/engine.css`. A layer with `"frame": "x"` gets class `xc-frame-x`, `"enter": "x"` gets `xc-enter-x`, `"animate": "x"` gets `xc-anim-x`, `"hover": "x"` gets `xc-hover-x`. To add one, add the CSS rule. Then list it in `CARD-SCHEMA.md`.

Each layer is three nested elements, so effects never fight over `transform`.

```
.xc-layer   position, size, rotation   (frame classes go here)
  .xc-enter   entrance and hover
    .xc-inner   looping animation and the content itself
```

Size anything inside the card in `cqw` units (1cqw = 1% of card width) so it scales with the card.

## Ideas backlog

Openers. Gift box with a bow that unties. Snow globe you shake. Advent doors grid. Scratch-off ornament. Pop-up book.

Effects. Confetti on open. Falling candy or glyph mix. Parallax on phone tilt. Background crackling-fire audio loop.

Layer features. Click-to-flip photos with a note on the back. Sticker that follows the pointer. Guestbook page (needs a backend, so think carefully).
