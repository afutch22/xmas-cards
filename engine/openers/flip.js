// Opener: a folded greeting card. Tap the cover and it swings open like a
// book, then the card itself takes over.
//
// options (all optional):
//   image      cover image path (fills the cover)
//   title      cover text, used when there is no image   "Merry & Bright"
//   color      cover background                         "#2f6b45"
//   textColor  cover text color                         "#fffaf0"
//   inside     color of the inside page                 "#fffaf0"
//   hint       text under the card                      "tap to open"

import { el, esc, injectCSS, setVars, wait } from "../util.js";

export default async function flip({ root, card, options: o, reducedMotion }) {
  injectCSS("xc-opener-flip", CSS);
  const scene = el("div", "xc-flip-scene");
  scene.innerHTML = `
    <div class="xc-flip-wrap">
      <div class="xc-flip" role="button" tabindex="0" aria-label="Open your card">
        <div class="xc-flip-inside"></div>
        <div class="xc-flip-cover">
          <div class="face front">${o.image ? `<img src="${esc(o.image)}" alt="">` : `<span>${esc(o.title ?? "Merry & Bright")}</span>`}</div>
          <div class="face back"></div>
        </div>
      </div>
      <p class="xc-flip-hint">${esc(o.hint ?? "tap to open")}</p>
    </div>`;
  const book = scene.querySelector(".xc-flip");
  book.style.setProperty("--ar", `${card.width} / ${card.height}`);
  setVars(scene, o, { color: "--cover", textColor: "--cover-ink", inside: "--inside" });
  root.append(scene);

  await new Promise((resolve) => {
    book.addEventListener("click", resolve, { once: true });
    book.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && resolve());
  });
  const t = reducedMotion ? 0.3 : 1;
  book.classList.add("is-open");
  await wait(900 * t);
  scene.classList.add("is-leaving");
  await wait(150 * t);
  setTimeout(() => scene.remove(), 900);
}

const CSS = `
.xc-flip-scene { --cover: #2f6b45; --cover-ink: #fffaf0; --inside: #fffaf0;
  position: fixed; inset: 0; z-index: 10; display: grid; place-items: center; transition: opacity .6s, transform .7s; }
.xc-flip-scene.is-leaving { opacity: 0; transform: scale(1.08); pointer-events: none; }
.xc-flip-wrap { display: grid; justify-items: center; gap: 1.2rem; }
.xc-flip { position: relative; width: min(70vw, calc(70dvh * var(--ar))); aspect-ratio: var(--ar); perspective: 1800px; cursor: pointer;
  filter: drop-shadow(0 18px 28px rgba(0,0,0,.35)); }
.xc-flip-inside { position: absolute; inset: 0; background: var(--inside); border-radius: 8px; }
.xc-flip-cover { position: absolute; inset: 0; transform-origin: left center; transform-style: preserve-3d; transition: transform 1s cubic-bezier(.4,.1,.2,1); }
.xc-flip.is-open .xc-flip-cover { transform: rotateY(-165deg); }
.xc-flip .face { position: absolute; inset: 0; border-radius: 8px; backface-visibility: hidden; overflow: hidden; }
.xc-flip .front { background: var(--cover); color: var(--cover-ink); display: grid; place-items: center; text-align: center; padding: 10%;
  font: clamp(28px, 7vw, 56px)/1.05 var(--xc-font-display); }
.xc-flip .front img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.xc-flip .back { background: color-mix(in srgb, var(--inside) 92%, black); transform: rotateY(180deg); }
.xc-flip-hint { margin: 0; color: rgba(255,255,255,.85); font: clamp(18px, 4vw, 26px) var(--xc-font-hand); }
.xc-flip.is-open + .xc-flip-hint { opacity: 0; }
`;
