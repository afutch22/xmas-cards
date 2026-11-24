# Working with an AI assistant

This system doesn't depend on any one AI. Paste the brief below into whichever assistant you use, then attach the files it lists. It works for Claude, ChatGPT, Gemini, or a human helper.

## The brief

Copy everything in the box.

```text
I make one digital holiday card a year with a small static-site system.
Please read these before suggesting anything:
- README.md (structure and principles)
- docs/CARD-SCHEMA.md (every field in card.json)
- docs/MODULES.md (how to add openers and effects)
- years/<YEAR>/card.json (this year's card)

Rules:
1. Plain HTML, CSS and JavaScript only. No frameworks, no npm, no build step.
2. All positions are design pixels matching a 1080 x 1350 frame unless stage says otherwise.
3. Year-specific choices go in card.json. Only reusable features go in engine/.
4. Never edit a published year's engine/ folder. Edit the shared engine/ folder.
5. New openers go in engine/openers/<name>.js, new effects in engine/effects/<name>.js,
   following the contracts in MODULES.md. One file per module with its CSS inside.
6. Give me complete files I can paste, not fragments, and tell me which path each goes to.
7. Respect prefers-reduced-motion.

This year I want: <DESCRIBE THE CARD OR THE CHANGE>
```

## Useful requests

- "Here's a screenshot of my Figma frame with the Design panel visible. Write the `layers` array for this page."
- "Write a new opener called `gift-box` where a present's lid pops off. Options for box color, ribbon color and tag text."
- "Turn this palette and these two fonts into the `theme` block."
- "Here's my card.json. Stagger the `enter` delays so things pop in left to right."
- "Check this card.json against CARD-SCHEMA.md and list anything invalid."

## Before accepting changes

1. Run `python3 tools/cards.py serve` and check the card still opens.
2. If the engine changed, open last year's card too and confirm it still works (it should, since it has its own copy).
3. Keep the diff small. One feature per session is easier to debug.
