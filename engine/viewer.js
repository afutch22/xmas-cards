// Photo viewer and note. Loaded only when a card has a gallery or a note.
//
// card.json:
//   "gallery": [ { "src": "assets/photo.jpg", "caption": "first snow", "alt": "..." }, ... ]
//   "note": { "label": "a note for you", "text": "Dear you,\n\n...", "signature": "love, Anni", "delay": 1 }
//
// Any layer with "zoom": <gallery index> opens the viewer at that photo.
// The note is the last item in the viewer. Its tag appears after the card is revealed.

import { el, esc, injectCSS } from "./util.js";

export default function viewer(ctx) {
  injectCSS("xc-viewer", CSS);
  const cfg = ctx.config;
  const items = [...(cfg.gallery || []).map((g) => ({ type: "photo", ...g }))];
  if (cfg.note) items.push({ type: "note", ...cfg.note });

  const box = el("div", "xc-v", { role: "dialog", "aria-modal": "true", "aria-label": "Photos" });
  box.innerHTML = `
    <div class="xc-v-top"><span class="xc-v-count"></span><button class="xc-v-close" aria-label="Close">✕</button></div>
    <div class="xc-v-body"></div>
    <div class="xc-v-nav"><button class="xc-v-prev" aria-label="Previous">‹</button><div class="xc-v-dots">${items.map(() => "<i></i>").join("")}</div><button class="xc-v-next" aria-label="Next">›</button></div>`;
  document.body.append(box);
  const body = box.querySelector(".xc-v-body");
  const count = box.querySelector(".xc-v-count");
  const prev = box.querySelector(".xc-v-prev");
  const next = box.querySelector(".xc-v-next");
  const photoCount = items.filter((i) => i.type === "photo").length;
  let idx = 0;
  let lastFocus = null;

  function render() {
    const it = items[idx];
    body.innerHTML =
      it.type === "photo"
        ? `<figure class="xc-v-photo"><img src="${esc(it.src)}" alt="${esc(it.alt || it.caption || "")}">${it.caption ? `<figcaption>${esc(it.caption)}</figcaption>` : ""}</figure>`
        : `<div class="xc-v-note"><div class="xc-v-note-text">${esc(it.text || "")}</div>${it.signature ? `<div class="xc-v-sig">${esc(it.signature)}</div>` : ""}</div>`;
    count.textContent = it.type === "photo" ? `${idx + 1} of ${photoCount}` : it.label || "a note";
    prev.disabled = idx === 0;
    next.disabled = idx === items.length - 1;
    box.querySelectorAll(".xc-v-dots i").forEach((d, k) => d.classList.toggle("on", k === idx));
  }
  function open(i = 0) {
    idx = Math.max(0, Math.min(items.length - 1, i));
    lastFocus = document.activeElement;
    render();
    box.classList.add("is-on");
    document.body.classList.add("xc-v-open");
    box.querySelector(".xc-v-close").focus();
  }
  function close() {
    box.classList.remove("is-on");
    document.body.classList.remove("xc-v-open");
    lastFocus?.focus?.();
  }
  const go = (d) => {
    const n = idx + d;
    if (n >= 0 && n < items.length) {
      idx = n;
      render();
    }
  };

  box.querySelector(".xc-v-close").onclick = close;
  prev.onclick = () => go(-1);
  next.onclick = () => go(1);
  box.addEventListener("click", (e) => {
    if (e.target === box || e.target === body) close();
  });
  addEventListener("keydown", (e) => {
    if (!box.classList.contains("is-on")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  });
  let sx = null;
  box.addEventListener("pointerdown", (e) => (sx = e.clientX));
  box.addEventListener("pointerup", (e) => {
    if (sx == null) return;
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
    sx = null;
  });

  let tagTimer;
  function showNoteTag() {
    if (!cfg.note) return;
    let tag = document.querySelector(".xc-note-tag");
    if (!tag) {
      tag = el("button", "xc-note-tag");
      tag.textContent = cfg.note.label || "a note for you";
      tag.onclick = () => open(items.length - 1);
      document.body.append(tag);
    }
    clearTimeout(tagTimer);
    tagTimer = setTimeout(() => tag.classList.add("is-on"), (cfg.note.delay ?? 1) * 1000);
  }

  // the card closing (gatefold) hides the viewer and the note tag until it opens again
  const hideAll = () => {
    close();
    clearTimeout(tagTimer);
    document.querySelector(".xc-note-tag")?.classList.remove("is-on");
  };
  ctx.card.el.addEventListener("xc:closing", hideAll);
  ctx.card.el.addEventListener("xc:hide", hideAll);

  return { open, close, showNoteTag };
}

const CSS = `
.xc-v { position: fixed; inset: 0; z-index: 100; display: grid; grid-template-rows: auto 1fr auto; gap: 10px; padding: max(14px, env(safe-area-inset-top)) 16px max(18px, env(safe-area-inset-bottom));
  background: var(--xc-viewer-bg, rgba(36, 28, 29, .94)); color: #f6e9e4; opacity: 0; pointer-events: none; transition: opacity .3s; font-family: var(--xc-font-body); }
.xc-v.is-on { opacity: 1; pointer-events: auto; }
.xc-v-top { display: flex; justify-content: space-between; align-items: center; font: 1.2rem var(--xc-font-hand); opacity: .85; }
.xc-v-close { width: 40px; height: 40px; border-radius: 50%; border: 0; background: rgba(255,255,255,.14); color: inherit; font-size: 1.1rem; cursor: pointer; }
.xc-v-body { display: grid; place-items: center; min-height: 0; container-type: size; }
.xc-v-photo { margin: 0; background: #fffaf6; padding: 3.5% 3.5% 0; width: min(88cqw, 64cqh); transform: rotate(-1.5deg); box-shadow: 0 18px 40px rgba(0,0,0,.5);
  animation: xc-v-pop .35s cubic-bezier(.2,1.4,.4,1); }
.xc-v-photo img { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; display: block; }
.xc-v-photo figcaption { font: clamp(16px, 5cqw, 28px)/1.15 var(--xc-font-hand); color: var(--xc-v-ink, #4c4243); text-align: center; padding: 4% 2% 6%; }
.xc-v-note { width: min(92cqw, 480px); max-height: 100cqh; overflow: auto; padding: 8% 8% 7%; color: var(--xc-v-ink, #4c4243);
  background: var(--xc-v-paper, #f3dcd6); box-shadow: 0 18px 40px rgba(0,0,0,.5); transform: rotate(.8deg); animation: xc-v-pop .35s cubic-bezier(.2,1.4,.4,1); }
.xc-v-note-text { white-space: pre-line; font: clamp(18px, 4.8cqw, 26px)/1.3 var(--xc-font-hand); }
.xc-v-sig { margin-top: 1em; text-align: right; font: clamp(30px, 8cqw, 46px)/1 var(--xc-font-display); color: var(--xc-v-accent, #b54544); }
.xc-v-nav { display: flex; justify-content: center; align-items: center; gap: 16px; }
.xc-v-nav button { width: 44px; height: 44px; border-radius: 50%; border: 0; background: #f6e9e4; color: #2a1d1b; font-size: 1.5rem; cursor: pointer; }
.xc-v-nav button:disabled { opacity: .3; cursor: default; }
.xc-v-dots { display: flex; gap: 7px; }
.xc-v-dots i { width: 7px; height: 7px; border-radius: 50%; background: currentColor; opacity: .35; }
.xc-v-dots i.on { opacity: 1; }
.xc-v button:focus-visible, .xc-note-tag:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
@keyframes xc-v-pop { from { transform: scale(.9) rotate(-4deg); opacity: 0; } }
.xc-note-tag { position: fixed; left: 50%; bottom: max(1.6vh, env(safe-area-inset-bottom)); z-index: 30; translate: -50% 0; border: 0; cursor: pointer; white-space: nowrap;
  padding: 9px 18px 9px 16px; border-radius: 4px; background: var(--xc-v-paper, #f3dcd6); color: var(--xc-v-accent, #b54544);
  font: 700 clamp(18px, 3.4vw, 24px) var(--xc-font-hand); box-shadow: 0 8px 20px rgba(0,0,0,.35);
  opacity: 0; transform: translateY(14px) rotate(-2deg); transition: opacity .5s, transform .5s cubic-bezier(.2,1.4,.4,1); pointer-events: none; }
.xc-note-tag::before { content: "✉"; margin-right: 8px; color: var(--xc-v-ink, #4c4243); }
.xc-note-tag.is-on { opacity: 1; transform: rotate(-2deg); pointer-events: auto; }
.xc-note-tag.is-on:hover { transform: rotate(0) scale(1.05); }
.xc-v-open .xc-note-tag { opacity: 0; pointer-events: none; }
`;
