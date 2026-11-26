// Opener: a sealed envelope. Tap the envelope, the flap lifts, a letter peeks
// out, the envelope drops away and the card pops up.
//
// options (all optional):
//   color       envelope color                       "#b8282f"
//   liner       flap lining, any CSS background      candy stripes
//   paper       color of the letter that peeks out   "#fffaf0"
//   seal        text/emoji on the wax seal           "♥"
//   sealColor   wax color                            "#d9b44a"
//   to          address label text                   (none)
//   stamp       text/emoji on the stamp              (none)
//   stampColor  stamp background                     "#2f6b45"
//   ink         address text color                   "#3a2a1a"
//   hint        text under the envelope              "tap to open"
//   hintColor   hint text color

import { el, esc, injectCSS, setVars, wait } from "../util.js";

export default async function envelope({ root, options: o, reducedMotion }) {
  injectCSS("xc-opener-envelope", CSS);
  const scene = el("div", "xc-env-scene");
  scene.innerHTML = `
    <div class="xc-env-wrap">
      <div class="xc-env" role="button" tabindex="0" aria-label="${esc(o.label || "Open your card")}">
        <div class="xc-env-back"></div>
        <div class="xc-env-paper"></div>
        <div class="xc-env-front"></div>
        ${o.stamp ? `<div class="xc-env-stamp"><span>${esc(o.stamp)}</span></div>` : ""}
        ${o.to ? `<div class="xc-env-to">${esc(o.to)}</div>` : ""}
        <div class="xc-env-flap"><i class="out"></i><i class="in"></i></div>
        <div class="xc-env-seal" aria-hidden="true">${esc(o.seal ?? "♥")}</div>
      </div>
      <p class="xc-env-hint">${esc(o.hint ?? "tap to open")}</p>
    </div>`;
  setVars(scene, o, {
    color: "--env",
    liner: "--liner",
    paper: "--env-paper",
    sealColor: "--seal",
    stampColor: "--stamp",
    ink: "--ink",
    hintColor: "--hint",
  });
  root.append(scene);

  const env = scene.querySelector(".xc-env");
  env.focus({ preventScroll: true });
  await new Promise((resolve) => {
    env.addEventListener("click", resolve, { once: true });
    env.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        resolve();
      }
    });
  });

  const t = reducedMotion ? 0.3 : 1;
  env.classList.add("is-open");
  await wait(650 * t);
  env.classList.add("is-flap-back", "is-pulled");
  await wait(850 * t);
  scene.classList.add("is-leaving");
  await wait(200 * t);
  setTimeout(() => scene.remove(), 1200);
}

const CSS = `
.xc-env-scene {
  --env: #b8282f; --liner: repeating-linear-gradient(45deg, #fbf4e6 0 12px, #efc9c2 12px 24px);
  --env-paper: #fffaf0; --seal: #d9b44a; --stamp: #2f6b45; --ink: #3a2a1a; --hint: rgba(255,255,255,.85);
  position: fixed; inset: 0; z-index: 10; display: grid; place-items: center;
  transition: opacity .7s ease, transform .9s cubic-bezier(.5,0,.75,0);
}
.xc-env-scene.is-leaving { opacity: 0; transform: translateY(35vh) rotate(5deg); pointer-events: none; }
.xc-env-wrap { display: grid; justify-items: center; gap: 1.4rem; }
.xc-env {
  position: relative; width: min(84vw, 520px); aspect-ratio: 1.55; perspective: 1400px; cursor: pointer;
  filter: drop-shadow(0 18px 28px rgba(0,0,0,.35)); animation: xc-env-bob 3.2s ease-in-out infinite; outline: none;
}
.xc-env.is-open { animation: none; }
.xc-env > div, .xc-env-flap { position: absolute; }
.xc-env-back { inset: 0; background: color-mix(in srgb, var(--env) 78%, black); border-radius: 6px; }
.xc-env-paper {
  left: 7%; right: 7%; top: 6%; height: 86%; z-index: 2; border-radius: 4px; background: var(--env-paper);
  background-image: repeating-linear-gradient(transparent 0 18px, rgba(0,0,0,.06) 18px 19px);
  transition: transform .85s cubic-bezier(.3,1.35,.5,1);
}
.xc-env.is-pulled .xc-env-paper { transform: translateY(-58%); }
.xc-env-front {
  inset: 0; z-index: 3; border-radius: 6px; background: var(--env);
  background-image: linear-gradient(160deg, rgba(255,255,255,.1), rgba(0,0,0,.1));
  clip-path: polygon(0 0, 50% 52%, 100% 0, 100% 100%, 0 100%);
}
.xc-env-flap { left: 0; right: 0; top: 0; height: 56%; z-index: 5; transform-origin: top center; transform-style: preserve-3d; transition: transform .7s ease; }
.xc-env-flap > i { position: absolute; inset: 0; backface-visibility: hidden; }
.xc-env-flap .out { background: color-mix(in srgb, var(--env) 90%, white); clip-path: polygon(0 0, 100% 0, 50% 100%); }
.xc-env-flap .in { background: var(--liner); clip-path: polygon(0 100%, 100% 100%, 50% 0); transform: rotateX(180deg); }
.xc-env.is-open .xc-env-flap { transform: rotateX(180deg); }
.xc-env.is-flap-back .xc-env-flap { z-index: 1; }
.xc-env-seal {
  left: 50%; top: 56%; translate: -50% -50%; z-index: 6; width: 17%; aspect-ratio: 1; border-radius: 50%;
  display: grid; place-items: center;
  background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--seal) 65%, white), var(--seal) 55%, color-mix(in srgb, var(--seal) 70%, black));
  color: color-mix(in srgb, var(--seal) 45%, black);
  font: 700 clamp(16px, 4.6vw, 28px)/1 var(--xc-font-display);
  box-shadow: 0 3px 0 rgba(0,0,0,.2), inset 0 -3px 6px rgba(0,0,0,.25);
  transition: transform .3s, opacity .3s;
}
.xc-env:hover .xc-env-seal, .xc-env:focus-visible .xc-env-seal { transform: rotate(-10deg) scale(1.08); }
.xc-env.is-open .xc-env-seal { opacity: 0; transform: scale(1.7); }
.xc-env-to {
  right: 8%; bottom: 12%; z-index: 4; max-width: 50%; padding: .35em .8em; background: var(--env-paper);
  color: var(--ink); font: clamp(15px, 3.6vw, 24px)/1.2 var(--xc-font-hand); transform: rotate(-2deg);
  box-shadow: 0 2px 4px rgba(0,0,0,.15); white-space: pre-line;
}
.xc-env-stamp {
  left: 6%; bottom: 12%; z-index: 4; width: 15%; aspect-ratio: .82; padding: 4px; background: #fff; transform: rotate(4deg);
  mask: linear-gradient(#000 0 0) content-box, radial-gradient(circle 3px, #0000 95%, #000) -4px -4px / 8px 8px;
  -webkit-mask: linear-gradient(#000 0 0) content-box, radial-gradient(circle 3px, #0000 95%, #000) -4px -4px / 8px 8px;
}
.xc-env-stamp span {
  display: grid; place-items: center; width: 100%; height: 100%; background: var(--stamp); color: #fffaf0;
  font: 700 clamp(14px, 4vw, 26px)/1 var(--xc-font-display); outline: 2px solid rgba(255,255,255,.6); outline-offset: -5px;
}
.xc-env-hint { margin: 0; color: var(--hint); font: clamp(18px, 4vw, 26px) var(--xc-font-hand); animation: xc-env-blink 2.2s ease-in-out infinite; }
.xc-env.is-open + .xc-env-hint { opacity: 0; animation: none; transition: opacity .3s; }
@keyframes xc-env-bob { 50% { transform: translateY(-7px) rotate(-.8deg); } }
@keyframes xc-env-blink { 50% { opacity: .45; } }
`;
