# Holiday Cards

A small system for making one digital holiday card a year and keeping every past card in an archive.

The design happens in whatever visual tool you like (Figma, Canva, Procreate). This repo turns that design into an interactive card people open from a link. Everything is plain HTML, CSS and JavaScript plus one Python script. No frameworks, no build step, no accounts. It works the same whether you do it by hand, with Claude, or with any other AI.

## How it fits together

```
xmas-cards/
  index.html          the archive page (lists every published card)
  archive.json        the list the archive page reads
  engine/             the shared card engine, improved a little each year
    engine.js           renders card.json
    engine.css          frames, entrances, animations
    editor.js           drag-to-arrange mode (?edit)
    openers/            envelope, flip, none ... add more here
    effects/            snow, twinkle-lights, sparkle-cursor ... add more here
  years/
    _template/        starting point for a new card
    example/          a working demo built from the template
    2026/             (you create this with the tool)
      card.json         everything about this year's card
      style.css         this year's CSS overrides (optional)
      assets/           exported art and photos
      engine/           a frozen copy of the engine from that year
      NOTES.md          what worked and what to change
  tools/cards.py      new, serve, sync-engine, stamp, publish, list
  docs/               the yearly runbook and references
```

Three ideas keep it durable.

1. **Each year is one JSON file plus assets.** `card.json` says where every photo, sticker and line of text sits, using the same pixel numbers as your design file. Any person or AI can read and edit it.
2. **Each year freezes its own engine.** Starting a card copies the current engine into that year's folder. Next year you can rebuild the engine completely and the 2026 card still opens exactly as it did.
3. **New ideas become modules.** A new opening animation is one file in `engine/openers/`. A new effect is one file in `engine/effects/`. The card picks them by name.

## Quick start

You need Python 3 (already on a Mac). In Terminal:

```bash
cd path/to/xmas-cards
python3 tools/cards.py serve
```

Open the `example` link it prints. Add `?edit` to the end of the URL to drag things around.

To start this year's card:

```bash
python3 tools/cards.py new 2026
```

Then follow [docs/PIPELINE.md](docs/PIPELINE.md).

## Docs

| Doc | Read it when |
| --- | --- |
| [PIPELINE.md](docs/PIPELINE.md) | Every year. The runbook from idea to sent link. |
| [DESIGN-HANDOFF.md](docs/DESIGN-HANDOFF.md) | Setting up your Figma or Canva file and exporting from it. |
| [CARD-SCHEMA.md](docs/CARD-SCHEMA.md) | Editing `card.json`. Every field explained. |
| [MODULES.md](docs/MODULES.md) | Adding a new opener, effect, frame or animation. |
| [AI-HANDOFF.md](docs/AI-HANDOFF.md) | Getting help from any AI assistant. A copy-paste brief. |
