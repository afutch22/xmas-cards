// Effect: falling snow on a canvas behind (or in front of) the card.
//
// options (all optional):
//   count   number of flakes          90
//   color   flake color               "#ffffff"
//   size    max flake radius in px    3
//   speed   fall speed multiplier     1
//   wind    sideways drift per frame  0
//   glyph   draw a character instead of dots, e.g. "❄" or "✦"
//   front   true = fall over the card false

export default function snow({ options: o = {}, reducedMotion }) {
  const count = reducedMotion ? Math.min(25, o.count ?? 90) : o.count ?? 90;
  const canvas = document.createElement("canvas");
  canvas.className = "xc-fx xc-fx-snow";
  canvas.style.zIndex = o.front ? 30 : 0;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  document.body.append(canvas);
  const ctx = canvas.getContext("2d");
  let w = 0, h = 0;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth;
    h = innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener("resize", resize);

  const spawn = (anyY) => ({
    x: Math.random() * w,
    y: anyY ? Math.random() * h : -12,
    r: 1 + Math.random() * (o.size ?? 3),
    vy: (0.3 + Math.random() * 0.9) * (o.speed ?? 1) * (reducedMotion ? 0.3 : 1),
    phase: Math.random() * Math.PI * 2,
    a: 0.45 + Math.random() * 0.55,
  });
  const flakes = Array.from({ length: count }, () => spawn(true));

  let raf;
  function tick() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = o.color || "#fff";
    for (const f of flakes) {
      f.y += f.vy;
      f.phase += 0.01;
      f.x += Math.sin(f.phase) * 0.4 + (o.wind ?? 0);
      if (f.y > h + 12) Object.assign(f, spawn(false));
      if (f.x > w + 12) f.x = -12;
      if (f.x < -12) f.x = w + 12;
      ctx.globalAlpha = f.a;
      if (o.glyph) {
        ctx.font = `${f.r * 5}px serif`;
        ctx.fillText(o.glyph, f.x, f.y);
      } else {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    removeEventListener("resize", resize);
    canvas.remove();
  };
}
