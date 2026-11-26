// Opener: gatefold doors. Two doors tied with a ribbon and bow cover the card.
// Tap to untie. The doors swing outward and stay open, so their insides become
// side panels holding photos from the card's gallery. The whole spread then
// zooms to fit the screen.
//
// options (all optional):
//   doorColor     outside of the doors                         "#b54544"
//   doorPattern   any CSS background-image for the doors       hand-drawn sparkles
//   patternColor  color of the default sparkle pattern         darker door color
//   insideColor   inside of the doors                          "#f0d6cf"
//   ribbonColor   ribbon and bow fill                          "#eacbc3"
//   inkColor      outline color for the drawn bow and ribbon   "#4c4243"
//   bowImage      your own bow drawing (PNG) instead of the drawn one
//   left, right   gallery indexes shown inside each door       [0, 1] and [2, 3]
//   photosDelay   seconds after opening before photos pop in   1.4
//   tape          washi tape on each photo                     true
//   trinkets      doodles around the photos, each one:
//                 { "side": "l"|"r", "kind": "bow"|"ornament"|"yarn"|"paw"|"candycane"|"holly"|"mouse"|"fish"|"heart",
//                   or "src": "assets/your.png", "x": %, "y": %, "w": % of door width, "rotate": deg, "animate": "sway"|"twinkle"|... }
//   doodleColors  { ink, red, deep, gold, pink, paper } for the doodles
//   closeLabel    text on the button that closes the card       "close the card"
// After opening, a button closes the doors again. Tap the bow to reopen; everything replays.
//   hint          text under the closed card                   "tap the bow"
//   hintColor     color of the hint                            "rgba(255,255,255,.8)"

import { el, esc, injectCSS, wait } from "../util.js";
import { doodle } from "../doodles.js";

export default async function gatefold({ root, card, config, options: o, reducedMotion, openGallery }) {
  injectCSS("xc-opener-gatefold", CSS);
  const gallery = config.gallery || [];
  const ink = o.inkColor || "#4c4243";
  const colors = { ink, ...(o.doodleColors || {}) };
  const t = reducedMotion ? 0.2 : 1;

  // wrap the card so the doors can sit on top of it and swing out from its edges
  const wrap = el("div", "xc-gf");
  wrap.style.setProperty("--door", o.doorColor || "#b54544");
  wrap.style.setProperty("--door-pattern", o.doorPattern || sparklePattern(o.patternColor || "rgba(0,0,0,.22)"));
  wrap.style.setProperty("--inside", o.insideColor || "#f0d6cf");
  wrap.style.setProperty("--ribbon", o.ribbonColor || "#eacbc3");
  wrap.style.setProperty("--ink", ink);
  card.el.style.transition = "none";
  card.el.classList.add("is-open"); // visible behind the doors, but not revealed yet
  root.append(wrap);
  wrap.append(card.el);
  requestAnimationFrame(() => (card.el.style.transition = ""));

  const sides = { l: o.left || [0, 1], r: o.right || [2, 3] };
  const insides = {};
  for (const side of ["l", "r"]) {
    const door = el("div", `xc-gf-door ${side}`);
    const inside = el("div", "xc-gf-face in");
    insides[side] = inside;
    const ids = sides[side].filter((i) => gallery[i]);
    const width = ids.length <= 1 ? 76 : ids.length === 2 ? 66 : 52;
    ids.forEach((gi, k) => {
      const g = gallery[gi];
      const snap = el("button", "xc-gf-snap", { "aria-label": `View photo${g.caption ? ": " + g.caption : ""}` });
      const slot = 100 / ids.length;
      const tilt = (k + (side === "l" ? 0 : 1)) % 2 ? 4 : -5;
      snap.style.cssText = `width:${width}%;left:${(100 - width) / 2 + (k % 2 ? 4 : -4)}%;top:${slot * k + slot * 0.1}%;--r:${tilt}deg;--i:${k + (side === "r" ? ids.length : 0)}`;
      snap.innerHTML = `<img src="${esc(g.src)}" alt="${esc(g.alt || "")}" draggable="false">${g.caption ? `<span>${esc(g.caption)}</span>` : ""}`;
      if (o.tape !== false) {
        const tape = el("i", "xc-gf-tape");
        tape.innerHTML = doodle("tape", colors);
        tape.style.setProperty("--tr", `${(k % 2 ? 6 : -7) - tilt}deg`);
        snap.append(tape);
      }
      snap.addEventListener("click", (e) => {
        e.stopPropagation();
        openGallery(gi);
      });
      inside.append(snap);
    });
    door.append(el("div", "xc-gf-face out"), inside);
    door.querySelector(".out").append(el("div", "xc-gf-band"));
    wrap.append(door);
  }

  // trinkets: little doodles (or your own PNGs) around the photos
  (o.trinkets || []).forEach((tk, i) => {
    const box = el("div", "xc-gf-trinket");
    box.style.cssText = `left:${tk.x}%;top:${tk.y}%;width:${tk.w || 18}%;--tr:${tk.rotate || 0}deg;--ti:${i}`;
    const art = tk.src ? `<img src="${esc(tk.src)}" alt="" draggable="false">` : doodle(tk.kind || "heart", colors);
    box.innerHTML = `<div class="xc-gf-tk${tk.animate ? " xc-anim-" + tk.animate : ""}" style="animation-delay:${(i * 0.37) % 2}s">${art}</div>`;
    (insides[tk.side] || insides.l).append(box);
  });

  const bow = o.bowImage ? el("img", "xc-gf-bow", { src: o.bowImage, alt: "" }) : el("div", "xc-gf-bow");
  if (!o.bowImage) bow.innerHTML = bowSVG(ink);
  wrap.append(bow);

  const hint = el("p", "xc-gf-hint");
  hint.textContent = o.hint ?? "tap the bow";
  if (o.hintColor) hint.style.color = o.hintColor;
  root.append(hint);

  const closeBtn = el("button", "xc-gf-close", { "aria-label": "Close the card" });
  closeBtn.textContent = o.closeLabel ?? "close the card";
  document.body.append(closeBtn);

  const fit = () => {
    const w = card.el.offsetWidth;
    wrap.style.setProperty("--fit", wrap.classList.contains("is-open") ? Math.min(1, (innerWidth * 0.96) / (w * 2)).toFixed(3) : 1);
  };
  addEventListener("resize", fit);

  const waitForTap = () =>
    new Promise((resolve) => {
      wrap.setAttribute("role", "button");
      wrap.setAttribute("tabindex", "0");
      wrap.setAttribute("aria-label", "Untie the bow to open the card");
      const go = () => {
        wrap.removeEventListener("click", go);
        wrap.removeEventListener("keydown", key);
        wrap.removeAttribute("role");
        wrap.removeAttribute("tabindex");
        wrap.removeAttribute("aria-label");
        resolve();
      };
      const key = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go();
        }
      };
      wrap.addEventListener("click", go);
      wrap.addEventListener("keydown", key);
    });

  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms * t));

  async function openDoors() {
    hint.classList.add("is-gone");
    wrap.classList.add("is-untied");
    await wait(420 * t);
    wrap.classList.add("is-open");
    fit();
    later(() => wrap.classList.add("show-photos"), (o.photosDelay ?? 1.4) * 1000);
    later(() => closeBtn.classList.add("is-on"), 2500);
    await wait(500 * t);
  }

  async function closeDoors() {
    timers.forEach(clearTimeout);
    timers = [];
    closeBtn.classList.remove("is-on");
    card.el.dispatchEvent(new CustomEvent("xc:closing"));
    wrap.classList.remove("show-photos");
    await wait(250 * t);
    wrap.classList.remove("is-open");
    fit();
    await wait(1250 * t);
    card.hide(); // reset the drawing so it plays again next time
    wrap.classList.remove("is-untied");
    hint.classList.remove("is-gone");
    await waitForTap();
    await openDoors();
    card.reveal();
  }
  closeBtn.addEventListener("click", closeDoors);

  // first open: resolve while the doors are still swinging so the drawing starts as they open
  await waitForTap();
  await openDoors();
}

function sparklePattern(color) {
  // a loose scatter of four-point sparkles, echoing the ones in the drawing
  const star = (x, y, s, r) =>
    `<path transform="translate(${x} ${y}) rotate(${r}) scale(${s})" d="M0 -10 C1 -3 3 -1 10 0 C3 1 1 3 0 10 C-1 3 -3 1 -10 0 C-3 -1 -1 -3 0 -10Z"/>`;
  const plus = (x, y, r) => `<path transform="translate(${x} ${y}) rotate(${r})" d="M0 -6 V6 M-6 0 H6" stroke-width="1.6" fill="none"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><g fill="${color}" stroke="${color}" stroke-linecap="round">${star(22, 26, 0.9, 8)}${star(84, 70, 0.6, -12)}${star(40, 98, 0.45, 20)}${plus(92, 18, 12)}${plus(58, 52, -8)}${plus(14, 70, 25)}${star(108, 108, 0.35, 0)}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function bowSVG(ink) {
  // sketchy hand-drawn bow: fill plus a slightly offset ink line
  const line = `fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"`;
  return `<svg viewBox="0 0 140 120" aria-hidden="true">
    <g fill="var(--ribbon)">
      <path d="M64 52 C56 76 46 94 34 116 L48 112 L56 118 C62 94 66 76 70 58Z"/>
      <path d="M76 52 C84 76 94 94 106 116 L92 112 L84 118 C78 94 74 76 70 58Z"/>
      <path d="M70 50 C46 14 8 18 10 44 C12 70 46 66 70 50Z"/>
      <path d="M70 50 C94 14 132 18 130 44 C128 70 94 66 70 50Z"/>
    </g>
    <g ${line}>
      <path d="M63 53 C55 77 45 95 33 117 L47 112 L56 119 C61 95 66 77 69 59"/>
      <path d="M77 53 C85 77 95 95 107 117 L93 112 L84 119 C79 95 74 77 71 59"/>
      <path d="M69 51 C45 13 7 19 9 45 C11 71 47 65 70 51"/>
      <path d="M71 51 C95 13 133 19 131 45 C129 71 93 65 70 50"/>
      <path d="M22 40 C32 44 44 46 56 48 M118 40 C108 44 96 46 84 48" stroke-width="1.4"/>
    </g>
    <ellipse cx="70" cy="51" rx="11" ry="12" fill="var(--ribbon)"/>
    <path d="M60 48 C60 38 80 38 80 50 C80 62 60 64 60 52" ${line}/>
  </svg>`;
}

const CSS = `
.xc-gf { position: relative; perspective: 2600px; transform: scale(var(--fit, 1)); transition: transform 1.1s cubic-bezier(.45,0,.2,1) .25s;
  animation: xc-gf-in .8s cubic-bezier(.2,1.2,.4,1) both; cursor: pointer; outline: none; }
.xc-gf.is-open { cursor: default; }
.xc-gf:focus-visible .xc-gf-bow { filter: drop-shadow(0 0 0 #fff) drop-shadow(0 0 6px #fff); }
@keyframes xc-gf-in { from { opacity: 0; transform: translateY(6vh) scale(.94); } }
.xc-gf-door { position: absolute; top: 0; bottom: 0; width: 50%; transform-style: preserve-3d; transition: transform 1.3s cubic-bezier(.45,0,.2,1); z-index: 5; }
.xc-gf-door.l { left: 0; transform-origin: left center; }
.xc-gf-door.r { right: 0; transform-origin: right center; }
.xc-gf.is-open .xc-gf-door.l { transform: rotateY(-180deg); }
.xc-gf.is-open .xc-gf-door.r { transform: rotateY(180deg); }
.xc-gf-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.xc-gf-face.out { background-color: var(--door); background-image: var(--door-pattern); background-size: 38% auto; box-shadow: 0 2cqw 6cqw rgba(0,0,0,.35); }
.l .xc-gf-face.out { border-radius: var(--xc-radius, 8px) 0 0 var(--xc-radius, 8px); box-shadow: inset -2px 0 0 rgba(0,0,0,.25), 0 20px 50px rgba(0,0,0,.4); }
.r .xc-gf-face.out { border-radius: 0 var(--xc-radius, 8px) var(--xc-radius, 8px) 0; box-shadow: inset 2px 0 0 rgba(255,255,255,.08), 0 20px 50px rgba(0,0,0,.4); }
.xc-gf-face.in { transform: rotateY(180deg); background: var(--inside); container-type: inline-size; box-shadow: 0 20px 50px rgba(0,0,0,.4); }
.l .xc-gf-face.in { border-radius: 0 var(--xc-radius, 8px) var(--xc-radius, 8px) 0; box-shadow: inset 10px 0 18px -12px rgba(0,0,0,.3), 0 20px 50px rgba(0,0,0,.4); }
.r .xc-gf-face.in { border-radius: var(--xc-radius, 8px) 0 0 var(--xc-radius, 8px); box-shadow: inset -10px 0 18px -12px rgba(0,0,0,.3), 0 20px 50px rgba(0,0,0,.4); }
.xc-gf-band { position: absolute; left: 0; right: 0; top: 46%; height: 7%; background: var(--ribbon); border-top: 2px solid var(--ink); border-bottom: 2px solid var(--ink);
  transition: transform .4s ease-in, opacity .4s; }
.l .xc-gf-band { transform-origin: left; } .r .xc-gf-band { transform-origin: right; }
.xc-gf.is-untied .xc-gf-band { transform: scaleX(0); opacity: 0; }
.xc-gf-bow { position: absolute; left: 50%; top: 49.5%; width: 34%; translate: -50% -42%; z-index: 6; pointer-events: none;
  transition: transform .45s cubic-bezier(.5,0,.75,0), opacity .45s; animation: xc-gf-wiggle 3.4s ease-in-out infinite 1.2s; }
.xc-gf-bow svg { width: 100%; display: block; overflow: visible; }
@keyframes xc-gf-wiggle { 0%, 82%, 100% { transform: none; } 86% { transform: rotate(-5deg); } 92% { transform: rotate(4deg); } }
.xc-gf.is-untied .xc-gf-bow { animation: none; transform: translateY(70%) rotate(24deg) scale(.6); opacity: 0; }
.xc-gf-snap { position: absolute; z-index: 1; padding: 5% 5% 0; border: 0; background: #fffaf6; cursor: zoom-in; display: grid; box-shadow: 0 .6cqw 1.6cqw rgba(0,0,0,.25);
  transform: rotate(var(--r)) scale(0); transition: transform .5s cubic-bezier(.2,1.6,.4,1); transition-delay: calc(var(--i) * .15s); }
.xc-gf-snap img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
.xc-gf-snap span { font: 9cqw/1.05 var(--xc-font-hand); color: var(--ink); padding: 4% 2% 7%; text-align: center; }
.xc-gf-snap:not(:has(span)) { padding-bottom: 16%; }
.show-photos .xc-gf-snap { transform: rotate(var(--r)); }
.show-photos .xc-gf-snap:hover { transform: rotate(0) scale(1.05); transition-delay: 0s; }
.xc-gf-snap:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
.xc-gf-tape { position: absolute; left: 30%; top: -6%; width: 40%; transform: rotate(var(--tr)); pointer-events: none; }
.xc-gf-trinket { position: absolute; z-index: 2; pointer-events: none; transform: rotate(var(--tr)) scale(0); transition: transform .45s cubic-bezier(.2,1.6,.4,1);
  transition-delay: calc(.6s + var(--ti) * .08s); }
.xc-gf-trinket img, .xc-gf-trinket svg { width: 100%; display: block; }
.show-photos .xc-gf-trinket { transform: rotate(var(--tr)); }
.xc-gf-close { position: fixed; top: max(14px, env(safe-area-inset-top)); right: 14px; z-index: 40; border: 0; cursor: pointer; padding: 8px 14px; border-radius: 999px;
  background: rgba(255,250,246,.9); color: var(--xc-v-ink, #4c4243); font: 600 14px/1 var(--xc-font-body, system-ui); box-shadow: 0 4px 12px rgba(0,0,0,.2);
  opacity: 0; transform: translateY(-8px); transition: opacity .4s, transform .4s; pointer-events: none; }
.xc-gf-close::before { content: "✕"; margin-right: 6px; font-size: 12px; }
.xc-gf-close.is-on { opacity: 1; transform: none; pointer-events: auto; }
.xc-v-open .xc-gf-close { opacity: 0; pointer-events: none; }
.xc-gf-hint { position: fixed; left: 0; right: 0; bottom: 4vh; margin: 0; text-align: center; z-index: 8; color: rgba(255,255,255,.8);
  font: clamp(18px, 4vw, 26px) var(--xc-font-hand); animation: xc-gf-blink 2.2s ease-in-out infinite; transition: opacity .3s; pointer-events: none; }
.xc-gf-hint.is-gone { opacity: 0; animation: none; }
@keyframes xc-gf-blink { 50% { opacity: .45; } }
`;
