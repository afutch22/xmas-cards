// Edit mode. Open the card with ?edit in the URL.
// Drag a layer to move it. Drag the blue corner to resize (hold Shift to keep
// proportions). Arrow keys nudge by 1px (Shift = 10px). Numbers in the panel
// are in design pixels, the same units as your Figma/Canva frame.
// When you're happy, Copy or Download card.json and replace the file.

import { el, injectCSS } from "./util.js";

const BASE_FIELDS = ["x", "y", "w", "h", "rotate", "z"];

export default function editor({ card, config }) {
  injectCSS("xc-editor", CSS);
  document.body.classList.add("xc-editing");
  const W = card.width;
  let selected = null;
  let dirty = false;

  const panel = el("div", "xc-ed");
  panel.innerHTML = `
    <div class="xc-ed-head"><strong>Edit mode</strong><button class="xc-ed-min" title="Minimize">–</button></div>
    <div class="xc-ed-body">
      <p class="xc-ed-tip">Drag to move. Corner to resize (Shift keeps shape). Arrows nudge.</p>
      <div class="xc-ed-name">Click a layer</div>
      <div class="xc-ed-fields"></div>
      <div class="xc-ed-actions">
        <button data-a="copy">Copy card.json</button>
        <button data-a="download">Download</button>
      </div>
      <div class="xc-ed-status"></div>
    </div>`;
  document.body.append(panel);
  const fieldsEl = panel.querySelector(".xc-ed-fields");
  const nameEl = panel.querySelector(".xc-ed-name");
  const statusEl = panel.querySelector(".xc-ed-status");
  panel.querySelector(".xc-ed-min").onclick = () => panel.classList.toggle("is-min");

  const json = () => JSON.stringify(config, null, 2) + "\n";
  const flash = (msg) => {
    statusEl.textContent = msg;
    setTimeout(() => (statusEl.textContent = dirty ? "Unsaved changes" : ""), 2200);
  };
  const markDirty = () => {
    dirty = true;
    statusEl.textContent = "Unsaved changes";
  };

  panel.querySelector('[data-a="copy"]').onclick = async () => {
    try {
      await navigator.clipboard.writeText(json());
      dirty = false;
      flash("Copied. Paste it over card.json.");
    } catch {
      flash("Clipboard blocked. Use Download.");
    }
  };
  panel.querySelector('[data-a="download"]').onclick = () => {
    const a = el("a", "", { download: "card.json", href: URL.createObjectURL(new Blob([json()], { type: "application/json" })) });
    a.click();
    dirty = false;
    flash("Downloaded. Replace card.json with it.");
  };
  addEventListener("beforeunload", (e) => {
    if (dirty) e.preventDefault();
  });

  function label(item) {
    const l = item.layer;
    return `${l.id || l.type || "image"} · page ${item.page + 1}`;
  }

  function renderFields() {
    fieldsEl.innerHTML = "";
    if (!selected) return;
    const l = selected.layer;
    nameEl.textContent = label(selected);
    const fields = l.type === "text" ? [...BASE_FIELDS, "size"] : BASE_FIELDS;
    for (const f of fields) {
      const wrap = el("label");
      wrap.textContent = f;
      const input = el("input", "", { type: "number", step: f === "rotate" ? "0.5" : "1" });
      input.value = l[f] ?? "";
      input.placeholder = f === "h" ? "auto" : "";
      input.oninput = () => {
        if (input.value === "") delete l[f];
        else l[f] = Number(input.value);
        card.place(selected.el, l);
        markDirty();
      };
      wrap.append(input);
      fieldsEl.append(wrap);
    }
  }
  const syncFields = () => {
    if (!selected) return;
    fieldsEl.querySelectorAll("input").forEach((input) => {
      const f = input.parentElement.firstChild.textContent;
      if (document.activeElement !== input) input.value = selected.layer[f] ?? "";
    });
  };

  function select(item) {
    selected?.el.classList.remove("is-selected");
    selected = item;
    item?.el.classList.add("is-selected");
    if (!item) nameEl.textContent = "Click a layer";
    renderFields();
  }

  for (const item of card.layers) {
    const { el: node, layer } = item;
    const handle = el("span", "xc-handle");
    node.append(handle);

    node.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      select(item);
      const resizing = e.target === handle;
      const scale = W / card.stage.getBoundingClientRect().width;
      const start = { x: e.clientX, y: e.clientY, l: { x: 0, y: 0, w: W, ...layer } };
      if (resizing && layer.h == null && layer.type !== "text") {
        start.l.h = Math.round(node.getBoundingClientRect().height * scale);
      }
      node.setPointerCapture(e.pointerId);

      const move = (ev) => {
        const dx = (ev.clientX - start.x) * scale;
        const dy = (ev.clientY - start.y) * scale;
        if (resizing) {
          layer.w = Math.max(10, Math.round(start.l.w + dx));
          if (layer.type !== "text") {
            layer.h = ev.shiftKey
              ? Math.round((layer.w * start.l.h) / start.l.w)
              : Math.max(10, Math.round(start.l.h + dy));
          }
        } else {
          layer.x = Math.round(start.l.x + dx);
          layer.y = Math.round(start.l.y + dy);
        }
        card.place(node, layer);
        syncFields();
        markDirty();
      };
      const up = () => {
        node.removeEventListener("pointermove", move);
        node.removeEventListener("pointerup", up);
      };
      node.addEventListener("pointermove", move);
      node.addEventListener("pointerup", up);
    });
  }

  card.stage.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".xc-layer")) return;
    select(null);
  });

  addEventListener("keydown", (e) => {
    if (!selected || e.target.tagName === "INPUT") return;
    const step = e.shiftKey ? 10 : 1;
    const moves = { ArrowLeft: ["x", -step], ArrowRight: ["x", step], ArrowUp: ["y", -step], ArrowDown: ["y", step] };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    selected.layer[m[0]] = (selected.layer[m[0]] || 0) + m[1];
    card.place(selected.el, selected.layer);
    syncFields();
    markDirty();
  });

  // switching pages clears the selection if the layer is no longer visible
  card.el.addEventListener("xc:page", (e) => {
    if (selected && selected.page !== e.detail) select(null);
  });
}

const CSS = `
.xc-editing .xc-layer { cursor: move; outline: 1px dashed rgba(77,150,255,.45); touch-action: none; }
.xc-editing .xc-layer:hover { outline: 1px solid #4d96ff; }
.xc-editing .xc-layer.is-selected { outline: 2px solid #4d96ff; }
.xc-editing .xc-link { pointer-events: none; }
.xc-editing .xc-inner[class*="xc-anim-"] { animation-play-state: paused; }
.xc-handle { display: none; }
.xc-editing .xc-layer.is-selected .xc-handle {
  display: block; position: absolute; right: -8px; bottom: -8px; width: 16px; height: 16px; z-index: 999;
  background: #4d96ff; border: 2px solid #fff; border-radius: 4px; cursor: nwse-resize; }
.xc-ed { position: fixed; right: 12px; bottom: 12px; z-index: 1000; width: 250px; background: #fff; color: #222;
  font: 13px/1.4 system-ui, sans-serif; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.3); overflow: hidden; }
.xc-ed-head { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #f4f1ea; }
.xc-ed-min { border: 0; background: none; font-size: 18px; cursor: pointer; line-height: 1; }
.xc-ed.is-min .xc-ed-body { display: none; }
.xc-ed-body { padding: 10px 12px 12px; }
.xc-ed-tip { margin: 0 0 8px; color: #777; font-size: 12px; }
.xc-ed-name { font-weight: 600; margin-bottom: 6px; }
.xc-ed-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 8px; }
.xc-ed-fields label { display: grid; gap: 2px; font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: .04em; }
.xc-ed-fields input { width: 100%; padding: 4px 6px; border: 1px solid #ddd; border-radius: 6px; font: inherit; }
.xc-ed-actions { display: flex; gap: 6px; margin-top: 10px; }
.xc-ed-actions button { flex: 1; padding: 7px; border: 0; border-radius: 8px; background: #4d96ff; color: #fff; font: 600 12px system-ui; cursor: pointer; }
.xc-ed-actions button + button { background: #e9e5dc; color: #222; }
.xc-ed-status { margin-top: 6px; min-height: 1.2em; color: #b8282f; font-size: 12px; }
`;
