// Layer add-on: write a text layer in, scratch out part of it, scrawl a correction above.
// Used on a text layer by adding "correct":
//
//   { "type": "text", "text": "Happy\nHolidays!", "font": "display", "size": 95, ...,
//     "correct": {
//       "strike": "Hol",            text to scratch out (first match)
//       "replace": "HOWL",          what gets scrawled above it
//       "font": "'Schoolbell', cursive",
//       "size": 69,                 design px
//       "color": "#4c4243",         scrawl and scratch color
//       "delay": 0.2,               seconds after the card is revealed
//       "write": 2.2,               seconds to write the original text
//       "seed": 11                  change for a different scratch
//     } }

import { el, injectCSS, wait } from "../util.js";

export default async function correction({ inner, layer: l, card, cq }) {
  injectCSS("xc-correction", CSS);
  const c = l.correct;
  const text = l.text || "";
  const at = text.indexOf(c.strike);
  const lines = text.split("\n");

  // rebuild the text: one block per line so each line can be "written" in turn
  inner.textContent = "";
  inner.classList.add("xc-cx");
  inner.style.setProperty("--cx-color", c.color || "#4c4243");
  let pos = 0;
  let strikeEl = null;
  lines.forEach((line, i) => {
    const ln = el("span", "xc-cx-line");
    ln.style.setProperty("--li", i);
    ln.style.setProperty("--ln", lines.length);
    const start = pos, end = pos + line.length;
    if (!strikeEl && at >= start && at < end) {
      const a = at - start;
      ln.append(line.slice(0, a));
      strikeEl = el("span", "xc-cx-strike");
      strikeEl.textContent = line.slice(a, a + c.strike.length);
      ln.append(strikeEl, line.slice(a + c.strike.length));
    } else ln.textContent = line;
    inner.append(ln);
    pos = end + 1;
  });
  inner.style.setProperty("--write", `${c.write ?? 2.2}s`);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("xc-cx-scratch");
  const word = el("div", "xc-cx-word");
  word.style.fontFamily = c.font || "var(--xc-font-hand)";
  word.style.fontSize = cq(c.size || 64);
  let seed = c.seed ?? 11;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  word.innerHTML = [...(c.replace || "")]
    .map((ch, i) => `<span style="--i:${i};--r:${(rand() * 14 - 7).toFixed(1)}deg;--y:${(rand() * 0.12 - 0.06).toFixed(3)}em">${ch}</span>`)
    .join("");
  inner.append(svg, word);
  if (!strikeEl) return;

  await document.fonts.ready;
  layout();
  addEventListener("resize", layout);

  function layout() {
    // measure in layout pixels (ignores CSS transforms), then store as % so it scales with the card
    const W = inner.offsetWidth, H = inner.offsetHeight;
    if (!W || !H) return;
    const sx = strikeEl.offsetLeft, sy = strikeEl.offsetTop, sw = strikeEl.offsetWidth, sh = strikeEl.offsetHeight;
    const x = sx - sw * 0.03, y = sy + sh * 0.22, w = sw * 0.98, h = sh * 0.52;
    Object.assign(svg.style, { left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, width: `${(w / W) * 100}%`, height: `${(h / H) * 100}%` });
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    seed = c.seed ?? 11;
    svg.innerHTML = strikes(w, h, W, rand)
      .map((s, k) => `<path pathLength="1" d="${s.d}" style="--k:${k};--dur:${s.dur}s;stroke-width:${s.sw.toFixed(2)}px;stroke-opacity:${s.op.toFixed(2)}"/>`)
      .join("");
    Object.assign(word.style, { left: `${((sx + sw * 0.02) / W) * 100}%`, top: `${((sy - word.offsetHeight * 0.42) / H) * 100}%` });
  }

  await card.revealed;
  await wait((c.delay ?? 0) * 1000 + (l.delay || 0) * 1000);
  inner.classList.add("is-writing");
}

// fast, slanted pencil strikes dragged back and forth
function strikes(w, h, W, rand) {
  const f = (n) => n.toFixed(1);
  const rough = (pts, amp) => {
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      for (let t = 1; t <= 3; t++) {
        const x = ax + ((bx - ax) * t) / 3, y = ay + ((by - ay) * t) / 3;
        d += ` L${f(x + (rand() - 0.5) * amp)} ${f(y + (t < 3 ? (rand() - 0.5) * amp : 0))}`;
      }
    }
    return d;
  };
  const out = [];
  const n = 6 + Math.floor(rand() * 2);
  for (let i = 0; i < n; i++) {
    const y0 = h * (0.05 + rand() * 0.9);
    const y1 = Math.min(h, Math.max(0, y0 + (rand() - 0.5) * h * 1.1));
    const xa = -w * (0.03 + rand() * 0.05), xb = w * (1.03 + rand() * 0.06);
    const mid = [w * 0.5, (y0 + y1) / 2 + (rand() - 0.5) * h * 0.15];
    const pts = i % 2 === 0 ? [[xa, y0], mid, [xb, y1]] : [[xb, y1], mid, [xa, y0]];
    out.push({ d: rough(pts, h * 0.08), sw: W * (0.006 + rand() * 0.005), op: 0.8 + rand() * 0.2, dur: 0.14 + rand() * 0.06 });
  }
  return out;
}

const CSS = `
.xc-cx { position: relative; }
.xc-cx-line { display: block; white-space: pre; clip-path: inset(-30% 100% -30% 0); }
.is-writing .xc-cx-line { animation: xc-cx-write calc(var(--write) / var(--ln)) cubic-bezier(.4,.1,.5,1) forwards; animation-delay: calc(var(--write) / var(--ln) * var(--li)); }
@keyframes xc-cx-write { to { clip-path: inset(-30% -10% -30% -10%); } }
.xc-cx-scratch { position: absolute; overflow: visible; pointer-events: none; }
.xc-cx-scratch path { fill: none; stroke: var(--cx-color); stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 1; }
.is-writing .xc-cx-scratch path { animation: xc-cx-scratch var(--dur) cubic-bezier(.6,0,.9,.6) forwards; animation-delay: calc(var(--write) + .5s + var(--k) * .12s); }
@keyframes xc-cx-scratch { to { stroke-dashoffset: 0; } }
.xc-cx-word { position: absolute; color: var(--cx-color); line-height: 1; white-space: nowrap; transform: rotate(-6deg); transform-origin: left bottom; pointer-events: none; }
.xc-cx-word span { display: inline-block; opacity: 0; transform: translateY(var(--y)) rotate(var(--r)) scale(1.5); }
.is-writing .xc-cx-word span { animation: xc-cx-scrawl .22s ease-out forwards; animation-delay: calc(var(--write) + 1.6s + var(--i) * .2s); }
@keyframes xc-cx-scrawl { to { opacity: 1; transform: translateY(var(--y)) rotate(var(--r)); } }
@media (prefers-reduced-motion: reduce) {
  .xc-cx-line { clip-path: none; }
  .xc-cx-scratch path { stroke-dashoffset: 0; }
  .xc-cx-word span { opacity: 1; transform: translateY(var(--y)) rotate(var(--r)); }
}
`;
