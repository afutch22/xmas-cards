Your own trinkets (little drawings around the photos)

1. In Procreate, draw each trinket on its own layer (any canvas size is fine).
2. Hide the background color, then Share > PNG (or Share Layers > PNG Files) so it saves with a transparent background.
3. Crop tight if you can (Procreate: Canvas > Crop & Resize). Name it simply, e.g. bow.png.
4. Put the PNG in this folder.
5. In years/2026/card.json, find "trinkets" (inside "opener" > "options") and add a line:

   { "side": "l", "src": "assets/trinkets/bow.png", "x": 62, "y": 2, "w": 26, "rotate": 12, "animate": "sway" },

   side     "l" = inside of the left door, "r" = inside of the right door
   x, y     where its top-left corner goes, in % of the door (0 0 = top left, 100 100 = bottom right)
   w        width in % of the door width (height follows the picture)
   rotate   tilt in degrees (optional)
   animate  optional: "sway", "twinkle", "bob", "pulse", "float", "jiggle", "shimmer"

   Watch the commas: every line in the list ends with a comma except the last one.

6. Save, run python3 tools/cards.py serve, open the 2026 link, tap the bow, and nudge x / y / w until it sits right.

Free spots on each door: the top corners, the middle gap between the two photos, and the bottom edge.
