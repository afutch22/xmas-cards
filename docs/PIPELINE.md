# The yearly pipeline

Seven steps, about 8 to 12 hours of work spread over three weeks. Dates assume you send around December 15. Shift them if you send later.

| When | Step | Time |
| --- | --- | --- |
| Nov 20 to 25 | 1. Concept | 1 hr |
| by Dec 1 | 2. Photos | 1 to 2 hr |
| Dec 1 to 7 | 3. Design | 3 to 5 hr |
| Dec 8 to 11 | 4. Build | 2 to 3 hr |
| Dec 12 to 13 | 5. Test | 1 hr |
| Dec 14 to 15 | 6. Publish and send | 30 min |
| early January | 7. Archive and notes | 20 min |

---

## 1. Concept

Decide three things and write them in `years/<year>/NOTES.md` once the folder exists.

1. **Opener.** How does the card open? Check `engine/openers/` for what exists (`envelope`, `flip`, `none`). If you want something new (a gift box, a snow globe, advent doors) note it now so there is time to build the module.
2. **Aesthetic.** Collect 3 to 6 reference images. Name the palette (4 or 5 hex colors) and two fonts (one display, one handwritten or body).
3. **Shape.** How many pages, and what goes on each? A common shape is page 1 photos plus greeting and page 2 a letter.

Checkpoint. You can describe the card in two sentences.

## 2. Photos

1. Pick 6 to 10 photos. Fewer reads better.
2. Crop each to roughly the shape it will appear in (4:5 for polaroids, 1:1 for circles).
3. Resize so the long edge is at most 1600 px. On a Mac you can do a whole folder at once in Terminal with `sips -Z 1600 *.jpg`.
4. Save as JPG around 80% quality. Aim for under 8 MB for the whole card so it opens fast on phones.

Privacy check. The link is public to anyone who has it. Skip photos that show your home address, house number, license plates or school names.

## 3. Design

Follow [DESIGN-HANDOFF.md](DESIGN-HANDOFF.md). The short version.

1. Make a 1080 × 1350 frame per page in Figma or Canva.
2. Arrange everything visually.
3. Export each moving or interactive piece as its own file. Flatten everything that never moves into one background image.
4. Note each piece's X, Y, W, H and rotation.

Checkpoint. A folder of exported PNG, SVG and JPG files with clear names.

## 4. Build

```bash
python3 tools/cards.py new 2026
# or reuse last year's structure
python3 tools/cards.py new 2027 --from 2026
```

1. Copy your exports into `years/<year>/assets/`. Delete the placeholder files you won't use.
2. Edit `years/<year>/card.json` ([CARD-SCHEMA.md](CARD-SCHEMA.md)).
   - `opener` and its colors
   - `theme` fonts and page background
   - `pages` and their `layers`, with the X, Y, W, H numbers from your design
   - `meta` title and description for the link preview
3. Preview with `python3 tools/cards.py serve`.
4. Open the year's link with `?edit` at the end. Drag and resize until it looks right. Press **Download** and replace `card.json` with the downloaded file.
5. If you changed anything in the shared `engine/` folder, pull it into this year with `python3 tools/cards.py sync-engine <year>`.

Checkpoint. The card opens, looks right, and every page works.

## 5. Test

Check each of these. Use `localhost` on your laptop and, for phones, a draft deploy from step 6.

- [ ] iPhone Safari, portrait
- [ ] Android Chrome, if someone you know has one
- [ ] Laptop Chrome or Safari, large window and small window
- [ ] Opener works by tapping and by keyboard (Tab then Enter)
- [ ] Every page reachable with arrows and swipe
- [ ] Text readable on a small phone
- [ ] Music (if any) starts after opening and the ♪ button stops it
- [ ] Send the link to yourself in iMessage and check the preview

## 6. Publish and send

1. Pick a preview image (1200 × 630 works well), put it in `assets/`, and set `meta.image` in `card.json`.
2. Deploy (see Hosting below). Copy the live URL of the card into `meta.url`.
3. Run `python3 tools/cards.py publish <year>`. This writes the link-preview tags and marks the card published in `archive.json`.
4. Deploy again so the preview tags go live.
5. Send the link.

### Hosting

Any static host works because the whole thing is plain files. Two good free options.

**GitHub Pages (free for public repositories).** Push this folder to a GitHub repository, then go to Settings → Pages and choose "Deploy from a branch" with `main` and `/ (root)`. Your archive lives at `https://<username>.github.io/<repo>/` and each card at `.../years/<year>/`. Note that a public repository means anyone can browse the files. Pages on a private repository needs a paid GitHub plan.

**Netlify Drop (free tier).** Go to app.netlify.com/drop and drag the whole `xmas-cards` folder onto the page. It gives you a random URL. Make a free account to keep the site and update it by dragging again.

## 7. Archive and notes

1. Fill in `years/<year>/NOTES.md` while it's fresh. What did people react to? What was fiddly?
2. If you built something reusable this year (a new opener, a new frame), make sure it lives in the shared `engine/` folder, not only in the year's copy. Bump `ENGINE_VERSION` in `engine/engine.js`.
3. Never edit a published year's `engine/` folder. That copy is what keeps the old card working.
