// Effect: your own drawn bits (sparkles, stars, anything) scattered across the
// page behind the card, with some of them slowly drifting down and turning.
// Use it instead of snow when you want the background made from your art.
//
// options:
//   images    list of image paths (transparent PNGs)          required
//   accents   images used rarely, e.g. a star                  []
//   still     how many stay put as a scattered pattern          18
//   falling   how many drift down                              10
//   size      [min, max] width in px                           [14, 30]
//   accentSize [min, max] width in px for accents              [34, 54]
//   speed     fall speed multiplier                            1
//   opacity   [min, max]                                       [0.55, 0.95]
//   front     true = drift over the card                       false

import { injectCSS } from "../util.js";

export default function drift({ options: o = {}, reducedMotion }) {
  const imgs = o.images || [];
  if (!imgs.length) return;
  injectCSS("xc-fx-drift", CSS);
  const layer = document.createElement("div");
  layer.className = "xc-fx xc-drift";
  layer.style.zIndex = o.front ? 30 : 0;
  document.body.append(layer);

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const [smin, smax] = o.size || [14, 30];
  const [amin, amax] = o.accentSize || [34, 54];
  const [omin, omax] = o.opacity || [0.55, 0.95];
  const accents = o.accents || [];

  // still scatter, spread on a loose grid so it doesn't clump
  const still = o.still ?? 18;
  const cols = Math.ceil(Math.sqrt(still * 1.4)), rows = Math.ceil(still / cols);
  for (let i = 0; i < still; i++) {
    const accent = accents.length && Math.random() < 0.12;
    const im = document.createElement("img");
    im.src = accent ? pick(accents) : pick(imgs);
    im.alt = "";
    const c = i % cols, r = Math.floor(i / cols);
    im.style.cssText = `left:${((c + rnd(0.15, 0.85)) / cols) * 100}%;top:${((r + rnd(0.15, 0.85)) / rows) * 100}%;width:${accent ? rnd(amin, amax) : rnd(smin, smax)}px;opacity:${rnd(omin, omax)};--r:${rnd(-30, 30)}deg;animation-delay:${rnd(0, 4)}s`;
    im.className = "xc-drift-still";
    layer.append(im);
  }

  // falling pieces
  if (!reducedMotion) {
    const n = o.falling ?? 10;
    for (let i = 0; i < n; i++) {
      const accent = accents.length && Math.random() < 0.2;
      const im = document.createElement("img");
      im.src = accent ? pick(accents) : pick(imgs);
      im.alt = "";
      const dur = rnd(14, 26) / (o.speed ?? 1);
      im.style.cssText = `left:${rnd(0, 100)}%;width:${accent ? rnd(amin, amax) : rnd(smin, smax)}px;opacity:${rnd(omin, omax)};--sway:${rnd(-60, 60)}px;--spin:${rnd(-280, 280)}deg;animation-duration:${dur}s;animation-delay:${-rnd(0, dur)}s`;
      im.className = "xc-drift-fall";
      layer.append(im);
    }
  }
  return () => layer.remove();
}

const CSS = `
.xc-drift { overflow: hidden; }
.xc-drift img { position: absolute; display: block; user-select: none; -webkit-user-drag: none; translate: -50% -50%; }
.xc-drift-still { transform: rotate(var(--r)); animation: xc-drift-tw 5s ease-in-out infinite; }
.xc-drift-fall { top: -8%; animation: xc-drift-fall linear infinite; }
@keyframes xc-drift-tw { 50% { transform: rotate(calc(var(--r) + 12deg)) scale(.85); } }
@keyframes xc-drift-fall {
  0% { transform: translate(0, 0) rotate(0); }
  50% { transform: translate(var(--sway), 58vh) rotate(calc(var(--spin) / 2)); }
  100% { transform: translate(0, 118vh) rotate(var(--spin)); } }
@media (prefers-reduced-motion: reduce) { .xc-drift-still { animation: none; } }
`;
