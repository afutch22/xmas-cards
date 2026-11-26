// Little hand-drawn trinkets (SVG) for decorating around photos.
// Each one is drawn with a doubled, slightly offset ink line so it reads as sketched.
// doodle(kind, colors) returns an SVG string. Kinds:
//   bow, ornament, yarn, paw, candycane, holly, mouse, fish, heart, tape
// colors: { ink, red, deep, gold, pink, paper }

const DEF = { ink: "#4c4243", red: "#b54544", deep: "#93302f", gold: "#e8c54b", pink: "#eacbc3", paper: "#fffaf6" };

const sketch = (d, c, w = 2.2, fill = "none") =>
  `<path d="${d}" fill="${fill}" stroke="none"/>` +
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w * 0.55}" stroke-linecap="round" stroke-linejoin="round" opacity=".55" transform="translate(1.1 .7) rotate(.8 50 50)"/>`;

const SHAPES = {
  bow: (k) => ({
    box: "0 0 100 80",
    body:
      sketch("M50 34 C34 8 6 10 8 30 C10 48 34 46 50 34Z", k.ink, 2.2, k.red) +
      sketch("M50 34 C66 8 94 10 92 30 C90 48 66 46 50 34Z", k.ink, 2.2, k.red) +
      sketch("M46 38 C40 54 34 64 26 76 L36 72 L42 78 C46 62 48 50 50 40Z", k.ink, 2, k.red) +
      sketch("M54 38 C60 54 66 64 74 76 L64 72 L58 78 C54 62 52 50 50 40Z", k.ink, 2, k.red) +
      sketch("M43 33 C43 25 57 25 57 34 C57 43 43 43 43 35Z", k.ink, 2, k.deep),
  }),
  ornament: (k) => ({
    box: "0 0 80 100",
    body:
      sketch("M40 2 V20", k.ink, 1.6) +
      sketch("M31 18 H49 V28 H31Z", k.ink, 1.8, k.gold) +
      sketch("M40 28 C62 28 74 44 74 62 C74 82 58 96 40 96 C22 96 6 82 6 62 C6 44 18 28 40 28Z", k.ink, 2.2, k.red) +
      sketch("M10 56 C28 64 52 64 70 56", k.gold, 3) +
      sketch("M12 72 C30 80 50 80 68 72", k.paper, 2.4) +
      `<ellipse cx="25" cy="45" rx="6" ry="9" fill="${k.paper}" opacity=".55" transform="rotate(30 25 45)"/>`,
  }),
  yarn: (k) => ({
    box: "0 0 110 90",
    body:
      sketch("M44 8 C66 8 80 24 80 44 C80 66 64 82 44 82 C22 82 8 66 8 44 C8 24 22 8 44 8Z", k.ink, 2.2, k.red) +
      sketch("M16 28 C34 34 52 52 58 78 M12 48 C28 48 44 62 46 80 M30 12 C46 22 66 40 76 60 M50 9 C60 20 74 30 80 42", k.deep, 1.8) +
      sketch("M78 56 C92 58 96 70 88 76 C80 82 94 88 106 84", k.red, 2),
  }),
  paw: (k) => ({
    box: "0 0 80 80",
    body:
      sketch("M40 40 C54 40 62 52 60 62 C58 72 48 70 40 70 C32 70 22 72 20 62 C18 52 26 40 40 40Z", k.ink, 1.6, k.ink) +
      sketch("M18 34 C12 34 10 24 15 20 C20 16 26 22 25 28 C24 32 22 34 18 34Z", k.ink, 1.4, k.ink) +
      sketch("M32 22 C26 22 25 11 30 8 C36 5 40 13 38 18 C37 21 35 22 32 22Z", k.ink, 1.4, k.ink) +
      sketch("M48 22 C44 21 42 13 47 8 C53 4 57 12 55 18 C54 21 51 22 48 22Z", k.ink, 1.4, k.ink) +
      sketch("M62 34 C58 34 55 27 59 22 C64 17 70 22 68 28 C67 32 65 34 62 34Z", k.ink, 1.4, k.ink),
  }),
  candycane: (k) => ({
    box: "0 0 60 110",
    body:
      sketch("M18 106 V36 C18 14 30 6 40 6 C50 6 56 14 56 24 C56 30 52 32 48 30", k.ink, 13) +
      sketch("M18 106 V36 C18 14 30 6 40 6 C50 6 56 14 56 24 C56 30 52 32 48 30", k.paper, 9) +
      sketch("M13 96 L23 90 M13 80 L23 74 M13 64 L23 58 M13 48 L23 42 M15 30 L25 26 M26 14 L32 22 M42 8 L42 17 M52 16 L47 21", k.red, 4.5),
  }),
  holly: (k) => ({
    box: "0 0 110 70",
    body:
      sketch("M54 36 C44 20 30 14 8 18 C14 24 10 30 16 34 C12 40 18 46 14 52 C34 54 46 48 54 36Z", k.ink, 2, "#5f7a45") +
      sketch("M56 36 C66 20 80 14 102 18 C96 24 100 30 94 34 C98 40 92 46 96 52 C76 54 64 48 56 36Z", k.ink, 2, "#5f7a45") +
      sketch("M16 34 C30 34 42 36 54 36 M94 34 C80 34 68 36 56 36", k.ink, 1.2) +
      sketch("M50 44 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0", k.ink, 1.8, k.red) +
      sketch("M62 46 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0", k.ink, 1.8, k.red) +
      sketch("M56 34 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0", k.ink, 1.8, k.red),
  }),
  mouse: (k) => ({
    box: "0 0 120 70",
    body:
      sketch("M24 50 C24 30 44 18 62 20 C80 22 92 36 94 50 Z", k.ink, 2.2, "#9a8f8f") +
      sketch("M58 22 C54 10 64 4 70 10 C74 14 72 20 68 22", k.ink, 1.8, k.pink) +
      sketch("M90 42 L104 44 M90 46 L102 52 M90 38 L102 34", k.ink, 1.3) +
      sketch("M24 50 C14 50 8 40 14 34 C20 28 12 18 4 22", k.red, 2.4) +
      `<circle cx="84" cy="38" r="2.6" fill="${k.ink}"/>` + sketch("M94 50 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0", k.ink, 1.2, k.pink),
  }),
  fish: (k) => ({
    box: "0 0 110 60",
    body:
      sketch("M14 30 C26 10 58 6 80 30 C58 54 26 50 14 30Z", k.ink, 2.2, "#c9d6d8") +
      sketch("M80 30 L104 12 L98 30 L104 48Z", k.ink, 2.2, "#c9d6d8") +
      sketch("M40 18 C46 26 46 34 40 42 M54 16 C60 26 60 34 54 44", k.ink, 1.4) +
      `<circle cx="26" cy="27" r="2.8" fill="${k.ink}"/>`,
  }),
  heart: (k) => ({
    box: "0 0 80 72",
    body: sketch("M40 68 C18 52 4 40 6 22 C8 6 30 2 40 20 C50 2 72 6 74 22 C76 40 62 52 40 68Z", k.ink, 2.2, k.red),
  }),
  tape: (k) => ({
    box: "0 0 120 34",
    body:
      `<path d="M4 6 L10 2 L16 6 L110 3 L116 8 L112 14 L117 20 L113 27 L116 32 L10 31 L4 26 L8 18 L3 12Z" fill="${k.pink}" opacity=".85"/>` +
      `<path d="M20 4 L14 31 M38 4 L32 31 M56 4 L50 31 M74 3 L68 31 M92 3 L86 31" stroke="${k.red}" stroke-width="5" opacity=".35"/>` +
      sketch("M4 6 L10 2 L16 6 L110 3 L116 8 L112 14 L117 20 L113 27 L116 32 L10 31 L4 26 L8 18 L3 12Z", k.ink, 1.1),
  }),
};

export function doodle(kind, colors = {}) {
  const k = { ...DEF, ...colors };
  const s = (SHAPES[kind] || SHAPES.heart)(k);
  return `<svg viewBox="${s.box}" aria-hidden="true" style="overflow:visible;display:block;width:100%">${s.body}</svg>`;
}

export const DOODLES = Object.keys(SHAPES);
