// Small shared helpers for the engine and its modules.

export function el(tag, className = "", attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

// Inject a module's CSS once. Every opener/effect keeps its CSS in its own file
// so one module = one file.
export function injectCSS(id, css) {
  if (document.getElementById(id)) return;
  const style = el("style", "", { id });
  style.textContent = css;
  // prepend so engine.css and the year's style.css (loaded as <link>s) can override module CSS
  document.head.prepend(style);
}

export function loadStylesheet(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  document.head.append(el("link", "", { rel: "stylesheet", href }));
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function esc(s = "") {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Map friendly option names to CSS custom properties on an element.
export function setVars(node, options, map) {
  for (const [key, cssVar] of Object.entries(map)) {
    if (options[key] != null) node.style.setProperty(cssVar, options[key]);
  }
}
