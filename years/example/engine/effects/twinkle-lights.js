// Effect: a swooping strand of blinking string lights across the top of the screen.
//
// options (all optional):
//   colors   bulb colors, cycled              red, gold, teal, blue, pink
//   spacing  px between bulbs                 56
//   sag      px depth of each swoop           22
//   wire     wire color                       "#1d2b22"
//   speed    seconds per blink                1.6

import { injectCSS } from "../util.js";

export default function twinkleLights({ options: o = {}, reducedMotion }) {
  injectCSS("xc-fx-lights", CSS);
  const colors = o.colors || ["#e63946", "#f4d35e", "#2a9d8f", "#4d96ff", "#ff8fab"];
  const sag = o.sag ?? 22;
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.classList.add("xc-fx", "xc-lights");
  svg.style.zIndex = 3;
  if (reducedMotion) svg.classList.add("is-still");
  document.body.append(svg);

  function draw() {
    const W = innerWidth;
    const height = sag + 40;
    svg.setAttribute("viewBox", `0 0 ${W} ${height}`);
    svg.style.height = `${height}px`;
    const swoops = Math.max(2, Math.round(W / 320));
    const span = W / swoops;
    const yAt = (x) => 6 + sag * Math.sin(Math.PI * ((x % span) / span));
    let d = "M0 6";
    for (let x = 4; x <= W; x += 4) d += ` L${x} ${yAt(x).toFixed(1)}`;
    const n = Math.max(6, Math.round(W / (o.spacing ?? 56)));
    let bulbs = "";
    for (let i = 0; i < n; i++) {
      const x = (W / n) * (i + 0.5);
      const y = yAt(x);
      const c = colors[i % colors.length];
      const tilt = Math.cos(Math.PI * ((x % span) / span)) * -18;
      bulbs += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${tilt.toFixed(1)})">
        <rect x="-3" y="0" width="6" height="6" rx="1" fill="${o.wire || "#1d2b22"}"/>
        <ellipse class="bulb" cx="0" cy="13" rx="6" ry="9" style="color:${c};animation-delay:${((i * 0.37) % 1.6).toFixed(2)}s;animation-duration:${o.speed ?? 1.6}s"/>
      </g>`;
    }
    svg.innerHTML = `<path d="${d}" fill="none" stroke="${o.wire || "#1d2b22"}" stroke-width="2"/>${bulbs}`;
  }
  draw();
  addEventListener("resize", draw);
  return () => {
    removeEventListener("resize", draw);
    svg.remove();
  };
}

const CSS = `
.xc-lights { inset: 0 0 auto 0; width: 100%; overflow: visible; }
.xc-lights .bulb { fill: currentColor; filter: drop-shadow(0 0 6px currentColor); animation: xc-bulb 1.6s ease-in-out infinite alternate; }
.xc-lights.is-still .bulb { animation: none; }
@keyframes xc-bulb { to { opacity: .35; filter: none; } }
`;
