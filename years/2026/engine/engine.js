// Xmas Card Engine
// Reads card.json and renders it. Openers and effects are plug-in modules
// loaded by name from ./openers/<name>.js and ./effects/<name>.js.
// Add ?edit to the URL to drag layers around and export an updated card.json.

import { el, loadStylesheet } from "./util.js";

export const ENGINE_VERSION = "1.3.0";

const params = new URLSearchParams(location.search);
const IS_EDIT = params.has("edit");
const REDUCED_MOTION = matchMedia("(prefers-reduced-motion: reduce)").matches;
const NAMED_FONTS = ["display", "hand", "body"];

export async function boot({ root = "#card-root", config = "card.json" } = {}) {
  const rootEl = typeof root === "string" ? document.querySelector(root) : root;
  let cfg;
  try {
    const res = await fetch(config, { cache: "no-store" });
    if (!res.ok) throw new Error(`${config} returned ${res.status}`);
    cfg = await res.json();
  } catch (err) {
    showError(rootEl, err);
    return;
  }

  applyTheme(cfg);
  const card = buildCard(cfg);
  rootEl.append(card.el);

  const ctx = { root: rootEl, card, config: cfg, reducedMotion: REDUCED_MOTION, editing: IS_EDIT };
  ctx.effects = await startEffects(ctx);
  // photo viewer + note (only loads when the card has a gallery or note)
  let viewer = null;
  ctx.openGallery = async (i = 0) => {
    if (!viewer) viewer = (await import("./viewer.js")).default(ctx);
    viewer.open(i);
  };
  card.el.addEventListener("xc:zoom", (e) => ctx.openGallery(e.detail));
  if (cfg.note) card.el.addEventListener("xc:reveal", async () => {
    if (!viewer) viewer = (await import("./viewer.js")).default(ctx);
    viewer.showNoteTag();
  });
  const music = cfg.music?.src ? addMusic(cfg.music) : null;

  if (IS_EDIT) {
    card.open();
    const { default: editor } = await import("./editor.js");
    editor(ctx);
    return ctx;
  }

  const opener = cfg.opener?.type || "none";
  try {
    const { default: run } = await import(`./openers/${opener}.js`);
    await run({ ...ctx, options: cfg.opener?.options || {} });
  } catch (err) {
    console.error(`Opener "${opener}" failed, opening card directly.`, err);
  }
  card.open();
  music?.tryPlay();
  return ctx;
}

/* ---------- theme ---------- */

function applyTheme(cfg) {
  const t = cfg.theme || {};
  if (cfg.meta?.title && !document.title) document.title = cfg.meta.title;
  // fontLinks first, then this year's own CSS so it can override anything in the engine
  [...(t.fontLinks || []), ...(t.stylesheets || [])].forEach(loadStylesheet);
  const rs = document.documentElement.style;
  if (t.page) rs.setProperty("--xc-page", t.page);
  for (const [k, v] of Object.entries(t.fonts || {})) rs.setProperty(`--xc-font-${k}`, v);
  for (const [k, v] of Object.entries(t.vars || {})) rs.setProperty(k.startsWith("--") ? k : `--${k}`, v);
}

/* ---------- card ---------- */

function buildCard(cfg) {
  const stageCfg = cfg.stage || {};
  const W = stageCfg.width || 1080;
  const H = stageCfg.height || 1350;
  const pct = (v, total) => `${(v / total) * 100}%`;
  const cq = (px) => `${((px / W) * 100).toFixed(4)}cqw`; // design px -> scales with card

  const cardEl = el("div", "xc-card");
  cardEl.style.setProperty("--w", W);
  cardEl.style.setProperty("--h", H);
  const stage = el("div", "xc-stage");
  if (stageCfg.clip === false) stage.classList.add("no-clip");
  if (stageCfg.radius != null) stage.style.borderRadius = cq(stageCfg.radius);
  if (stageCfg.shadow === false) stage.classList.add("no-shadow");
  cardEl.append(stage);

  const cardApi = {}; // filled in at the end; modules get it early
  const pages = [];
  const layers = [];
  const pageCfgs = cfg.pages?.length ? cfg.pages : [{ layers: [] }];

  pageCfgs.forEach((p, pi) => {
    const pg = el("div", "xc-page");
    pg.style.background = p.background || stageCfg.background || "#fff";
    const bgImg = p.backgroundImage || stageCfg.backgroundImage;
    if (bgImg) pg.style.backgroundImage = `url("${bgImg}")`;
    (p.layers || []).forEach((l, li) => {
      const lel = renderLayer(l);
      place(lel, l, li + 1);
      pg.append(lel);
      layers.push({ el: lel, layer: l, page: pi });
    });
    stage.append(pg);
    pages.push(pg);
  });

  function place(lel, l, fallbackZ) {
    const s = lel.style;
    s.left = pct(l.x || 0, W);
    s.top = pct(l.y || 0, H);
    s.width = pct(l.w ?? W, W);
    s.height = l.h != null ? pct(l.h, H) : "";
    s.setProperty("--rot", `${l.rotate || 0}deg`);
    if (l.size) s.fontSize = cq(l.size);
    if (l.z != null) s.zIndex = l.z;
    else if (fallbackZ != null) s.zIndex = fallbackZ;
  }

  function renderLayer(l) {
    const type = l.type || "image";
    const outer = el("div", `xc-layer xc-${type}`);
    if (l.id) outer.dataset.id = l.id;
    if (l.frame) outer.classList.add(`xc-frame-${l.frame}`);
    if (l.className) outer.classList.add(...l.className.split(/\s+/));

    const enter = el("div", "xc-enter");
    if (l.enter) {
      enter.classList.add(`xc-enter-${l.enter}`);
      enter.style.animationDelay = `${l.delay || 0}s`;
      if (l.duration) enter.style.animationDuration = `${l.duration}s`;
      if (l.from) {
        // where a "slide" or "tumble" entrance starts, in design px relative to its final spot
        enter.style.setProperty("--fx", cq(l.from.x || 0));
        enter.style.setProperty("--fy", cq(l.from.y || 0));
        enter.style.setProperty("--fr", `${l.from.rotate || 0}deg`);
      }
    }
    if (l.hover) enter.classList.add(`xc-hover-${l.hover}`);

    const inner = el("div", "xc-inner");
    if (l.animate) {
      inner.classList.add(`xc-anim-${l.animate}`);
      if (l.speed) inner.style.animationDuration = `${l.speed}s`;
    }

    if (type === "image") {
      const img = el("img", "", { alt: l.alt || "", draggable: "false", decoding: "async" });
      img.src = l.src;
      if (l.fit) img.style.objectFit = l.fit;
      inner.append(img);
      if (l.caption) inner.append(Object.assign(el("div", "xc-caption"), { textContent: l.caption }));
    } else if (type === "text") {
      inner.textContent = l.text || "";
      const s = inner.style;
      if (l.color) s.color = l.color;
      if (l.align) s.textAlign = l.align;
      if (l.font) s.fontFamily = NAMED_FONTS.includes(l.font) ? `var(--xc-font-${l.font})` : l.font;
      if (l.weight) s.fontWeight = l.weight;
      if (l.lineHeight) s.lineHeight = l.lineHeight;
      if (l.letterSpacing != null) s.letterSpacing = `${l.letterSpacing}em`;
      if (l.shadow) s.textShadow = l.shadow === true ? "0 0.04em 0 rgba(0,0,0,.25)" : l.shadow;
    } else if (type === "box") {
      inner.style.background = l.fill || "transparent";
      if (l.radius != null) inner.style.borderRadius = typeof l.radius === "number" ? cq(l.radius) : l.radius;
    } else if (type === "html") {
      inner.innerHTML = l.html || "";
    }

    if (l.style) Object.assign(inner.style, l.style); // escape hatch: camelCase CSS

    let content = inner;
    if (l.correct) {
      // scratch-out-and-rewrite effect, lives in its own module
      import("./layers/correction.js").then((m) => m.default({ outer, inner, layer: l, card: cardApi, cq }));
    }
    if (l.zoom != null) {
      outer.classList.add("xc-zoomable");
      outer.addEventListener("click", () => cardEl.dispatchEvent(new CustomEvent("xc:zoom", { detail: l.zoom })));
    }

    if (l.href) {
      content = el("a", "xc-link", { href: l.href, target: "_blank", rel: "noopener" });
      content.append(inner);
    }
    enter.append(content);
    outer.append(enter);
    return outer;
  }

  // ----- page navigation -----
  let current = 0;
  let nav = null;
  if (pages.length > 1) {
    const labels = cfg.nav || {};
    nav = el("div", "xc-nav");
    const prev = el("button", "xc-nav-btn", { "aria-label": "Previous page" });
    prev.textContent = labels.prev || "‹";
    const next = el("button", "xc-nav-btn", { "aria-label": "Next page" });
    next.textContent = labels.next || "›";
    const dots = el("div", "xc-dots");
    pages.forEach((_, i) => {
      const d = el("button", "xc-dot", { "aria-label": `Page ${i + 1}` });
      d.onclick = () => show(i);
      dots.append(d);
    });
    prev.onclick = () => show(current - 1);
    next.onclick = () => show(current + 1);
    nav.append(prev, dots, next);
    cardEl.append(nav);

    addEventListener("keydown", (e) => {
      if (document.body.classList.contains("xc-editing")) return;
      if (e.key === "ArrowRight") show(current + 1);
      if (e.key === "ArrowLeft") show(current - 1);
    });
    let sx = null;
    stage.addEventListener("pointerdown", (e) => (sx = e.clientX));
    stage.addEventListener("pointerup", (e) => {
      if (sx == null || document.body.classList.contains("xc-editing")) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      sx = null;
    });
  }

  function show(i) {
    current = Math.max(0, Math.min(pages.length - 1, i));
    pages.forEach((p, k) => p.classList.toggle("is-active", k === current));
    if (nav) {
      const [prev, dots, next] = nav.children;
      prev.disabled = current === 0;
      next.disabled = current === pages.length - 1;
      [...dots.children].forEach((d, k) => d.classList.toggle("is-active", k === current));
    }
    cardEl.dispatchEvent(new CustomEvent("xc:page", { detail: current }));
  }
  show(0);

  let markRevealed;
  const revealed = new Promise((r) => (markRevealed = r));
  Object.assign(cardApi, {
    el: cardEl,
    stage,
    pages,
    layers,
    width: W,
    height: H,
    show,
    place,
    revealed, // resolves when the card is first revealed (opener done)
    open: () => {
      cardEl.classList.add("is-open");
      cardApi.reveal();
    },
    // reveal plays every entrance; hide resets them so a reopened card plays again
    reveal: () => {
      cardEl.classList.add("is-revealed");
      markRevealed();
      cardEl.dispatchEvent(new CustomEvent("xc:reveal"));
    },
    hide: () => {
      cardEl.classList.remove("is-revealed");
      cardEl.dispatchEvent(new CustomEvent("xc:hide"));
    },
  });
  Object.defineProperty(cardApi, "current", { get: () => current });
  return cardApi;
}

/* ---------- effects ---------- */

async function startEffects(ctx) {
  const stops = [];
  for (const fx of ctx.config.effects || []) {
    const spec = typeof fx === "string" ? { type: fx } : fx;
    try {
      const { default: start } = await import(`./effects/${spec.type}.js`);
      const stop = start({ ...ctx, options: spec.options || {} });
      if (typeof stop === "function") stops.push(stop);
    } catch (err) {
      console.error(`Effect "${spec.type}" failed`, err);
    }
  }
  return { stopAll: () => stops.forEach((s) => s()) };
}

/* ---------- music ---------- */

function addMusic(m) {
  const audio = new Audio(m.src);
  audio.loop = m.loop !== false;
  audio.volume = m.volume ?? 0.5;
  const btn = el("button", "xc-music", { "aria-label": "Toggle music" });
  btn.textContent = m.icon || "♪";
  const sync = () => btn.classList.toggle("is-playing", !audio.paused);
  btn.onclick = () => (audio.paused ? audio.play() : audio.pause());
  audio.addEventListener("play", sync);
  audio.addEventListener("pause", sync);
  document.body.append(btn);
  return {
    audio,
    tryPlay() {
      if (m.autoplay !== false) audio.play().catch(() => {});
    },
  };
}

/* ---------- errors ---------- */

function showError(root, err) {
  const box = el("div", "xc-error");
  const local = location.protocol === "file:";
  box.innerHTML = local
    ? `<strong>This card needs a tiny local server.</strong><br>In Terminal, from the xmas-cards folder, run<br><code>python3 tools/cards.py serve</code><br>then open the link it prints.`
    : `<strong>Couldn't load card.json.</strong><br><code>${String(err.message || err)}</code>`;
  root.append(box);
  console.error(err);
}
