// Effect: little sparkles trail the mouse or finger.
//
// options (all optional):
//   glyphs  characters to sprinkle   ["✦", "✧", "★", "❄"]
//   colors  sparkle colors           gold, pink, white, ice blue
//   every   ms between sparkles      40
//   size    px font size             16

import { injectCSS } from "../util.js";

export default function sparkleCursor({ options: o = {}, reducedMotion }) {
  if (reducedMotion) return;
  injectCSS("xc-fx-sparkle", CSS);
  const glyphs = o.glyphs || ["✦", "✧", "★", "❄"];
  const colors = o.colors || ["#ffd966", "#ff8fab", "#ffffff", "#9be7ff"];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  let last = 0;

  function onMove(e) {
    const now = performance.now();
    if (now - last < (o.every ?? 40)) return;
    last = now;
    const s = document.createElement("span");
    s.className = "xc-sparkle";
    s.textContent = pick(glyphs);
    s.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;color:${pick(colors)};font-size:${o.size ?? 16}px;--dx:${(Math.random() - 0.5) * 40}px`;
    document.body.append(s);
    s.addEventListener("animationend", () => s.remove());
  }
  addEventListener("pointermove", onMove);
  return () => removeEventListener("pointermove", onMove);
}

const CSS = `
.xc-sparkle { position: fixed; z-index: 60; pointer-events: none; translate: -50% -50%; text-shadow: 0 0 6px currentColor;
  animation: xc-sparkle .9s ease-out forwards; }
@keyframes xc-sparkle { to { transform: translate(var(--dx), 34px) scale(.2) rotate(120deg); opacity: 0; } }
`;
