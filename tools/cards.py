#!/usr/bin/env python3
"""Holiday card toolkit. Python 3 standard library only, no installs.

Run from anywhere:
  python3 tools/cards.py new 2026                 start a card from the template
  python3 tools/cards.py new 2027 --from 2026     start from last year's card
  python3 tools/cards.py serve                    preview at http://localhost:8000
  python3 tools/cards.py sync-engine 2026         copy the latest engine into a draft
  python3 tools/cards.py stamp 2026               write link-preview tags from card.json
  python3 tools/cards.py publish 2026             mark as published in the archive
  python3 tools/cards.py list                     show every card and its status
  python3 tools/cards.py crop-layers 2026         crop full-canvas layer PNGs and update card.json
"""

import argparse
import datetime
import html
import http.server
import json
import re
import shutil
import sys
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENGINE = ROOT / "engine"
YEARS = ROOT / "years"
ARCHIVE = ROOT / "archive.json"


# ---------- helpers ----------

def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def write_json(path, data):
    Path(path).write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def engine_version(engine_dir=ENGINE):
    m = re.search(r'ENGINE_VERSION\s*=\s*"([^"]+)"', (engine_dir / "engine.js").read_text())
    return m.group(1) if m else "unknown"


def card_dir(name):
    d = YEARS / name
    if not (d / "card.json").exists():
        sys.exit(f"No card found at years/{name}/card.json")
    return d


def load_archive():
    return read_json(ARCHIVE) if ARCHIVE.exists() else {"title": "Holiday Cards", "subtitle": "", "cards": []}


def archive_entry(archive, name):
    return next((c for c in archive["cards"] if c["id"] == name), None)


def copy_engine(dest):
    target = dest / "engine"
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(ENGINE, target)


# ---------- commands ----------

def cmd_new(args):
    src = YEARS / args.source
    dest = YEARS / args.name
    if dest.exists():
        sys.exit(f"years/{args.name} already exists.")
    if not (src / "card.json").exists():
        sys.exit(f"Nothing to copy at years/{args.source}.")

    shutil.copytree(src, dest, ignore=shutil.ignore_patterns("engine", "NOTES.md", ".DS_Store"))
    copy_engine(dest)

    cfg = read_json(dest / "card.json")
    cfg["year"] = args.name
    cfg["engine"] = engine_version()
    write_json(dest / "card.json", cfg)
    (dest / "NOTES.md").write_text(
        f"# {args.name} card notes\n\n"
        "## Concept\n\n\n## What worked\n\n\n## What to change next year\n\n\n"
        "## Engine ideas (new openers, effects, fixes)\n\n",
        encoding="utf-8",
    )

    archive = load_archive()
    archive["cards"] = [c for c in archive["cards"] if c["id"] != args.name]
    archive["cards"].append(entry_from_card(args.name, cfg, status="draft"))
    write_json(ARCHIVE, archive)
    stamp(args.name)

    print(f"Created years/{args.name} (engine {cfg['engine']}, copied from {args.source}).")
    print("Next:")
    print("  1. Put your exported art and photos in years/%s/assets/" % args.name)
    print("  2. Edit years/%s/card.json" % args.name)
    print("  3. python3 tools/cards.py serve   then open the printed links")


def entry_from_card(name, cfg, status):
    meta = cfg.get("meta") or {}
    opener = (cfg.get("opener") or {}).get("options") or {}
    return {
        "id": name,
        "title": meta.get("title") or name,
        "path": f"years/{name}/",
        "cover": f"years/{name}/{meta['image']}" if meta.get("image") else None,
        "color": opener.get("color") or "#b8282f",
        "status": status,
    }


def cmd_sync_engine(args):
    dest = card_dir(args.name)
    entry = archive_entry(load_archive(), args.name)
    if entry and entry.get("status") == "published" and not args.force:
        sys.exit(
            f"{args.name} is published. Its engine is frozen so the archive never breaks.\n"
            "Use --force only if you mean to change a sent card."
        )
    copy_engine(dest)
    cfg = read_json(dest / "card.json")
    cfg["engine"] = engine_version()
    write_json(dest / "card.json", cfg)
    print(f"years/{args.name}/engine is now engine {cfg['engine']}.")


def stamp(name):
    """Write title and link-preview (Open Graph) tags into index.html from card.json."""
    d = card_dir(name)
    cfg = read_json(d / "card.json")
    meta = cfg.get("meta") or {}
    e = lambda s: html.escape(str(s), quote=True)
    title = meta.get("title") or "Happy Holidays"
    desc = meta.get("description") or ""
    tags = [f"<title>{e(title)}</title>", f'<meta property="og:title" content="{e(title)}">']
    if desc:
        tags += [f'<meta name="description" content="{e(desc)}">', f'<meta property="og:description" content="{e(desc)}">']
    if meta.get("image"):
        img = meta["image"]
        if meta.get("url"):
            img = meta["url"].rstrip("/") + "/" + img.lstrip("./")
        tags += [f'<meta property="og:image" content="{e(img)}">', '<meta name="twitter:card" content="summary_large_image">']
    if meta.get("url"):
        tags.append(f'<meta property="og:url" content="{e(meta["url"])}">')
    tags.append('<meta property="og:type" content="website">')

    index = d / "index.html"
    src = index.read_text(encoding="utf-8")
    block = "\n".join(tags)
    new, n = re.subn(
        r"(<!-- meta:start[^>]*-->)(.*?)(<!-- meta:end -->)",
        lambda m: f"{m.group(1)}\n{block}\n{m.group(3)}",
        src,
        flags=re.S,
    )
    if not n:
        print("index.html has no meta:start / meta:end markers. Skipped.")
        return
    index.write_text(new, encoding="utf-8")

    archive = load_archive()
    entry = archive_entry(archive, name)
    if entry:
        fresh = entry_from_card(name, cfg, entry.get("status", "draft"))
        entry.update({k: v for k, v in fresh.items() if k != "status"})
        write_json(ARCHIVE, archive)


def cmd_stamp(args):
    stamp(args.name)
    print(f"Updated link-preview tags in years/{args.name}/index.html.")


def cmd_publish(args):
    d = card_dir(args.name)
    cfg = read_json(d / "card.json")
    stamp(args.name)
    archive = load_archive()
    entry = archive_entry(archive, args.name) or entry_from_card(args.name, cfg, "draft")
    if entry not in archive["cards"]:
        archive["cards"].append(entry)
    entry["status"] = "published"
    entry["publishedAt"] = datetime.date.today().isoformat()
    write_json(ARCHIVE, archive)
    print(f"{args.name} is published in archive.json (engine {cfg.get('engine')} frozen in its folder).")
    if not (cfg.get("meta") or {}).get("url"):
        print("Tip: set meta.url in card.json to the live link, then run stamp again, so text-message previews show the image.")
    print("Now push or upload the folder to your host (see docs/PIPELINE.md, step 6).")


def cmd_list(args):
    archive = load_archive()
    known = {c["id"]: c for c in archive["cards"]}
    for d in sorted(p for p in YEARS.iterdir() if (p / "card.json").exists()):
        if d.name.startswith("_"):
            continue
        cfg = read_json(d / "card.json")
        status = known.get(d.name, {}).get("status", "not in archive")
        print(f"{d.name:<12} {status:<10} engine {cfg.get('engine', '?'):<8} {cfg.get('opener', {}).get('type', 'none')}")


def cmd_crop_layers(args):
    """Crop full-canvas PNGs in assets/layers/ to their drawn area, save to assets/art/,
    and update x, y, w, h for layers in card.json that use assets/art/<name>.png."""
    try:
        from PIL import Image
    except ImportError:
        sys.exit("This needs Pillow (free). Install it once with:\n  python3 -m pip install --user pillow")
    d = card_dir(args.name)
    src_dir, out_dir = d / "assets" / "layers", d / "assets" / "art"
    out_dir.mkdir(parents=True, exist_ok=True)
    cfg = read_json(d / "card.json")
    W = (cfg.get("stage") or {}).get("width", 1080)
    H = (cfg.get("stage") or {}).get("height", 1350)
    boxes = {}
    for png in sorted(src_dir.glob("*.png")):
        if png.stem.startswith("background"):
            continue
        im = Image.open(png).convert("RGBA")
        if im.size != (W, H):
            print(f"  {png.name}: canvas is {im.size[0]} x {im.size[1]}, expected {W} x {H}. Scaling to match.")
            im = im.resize((W, H), Image.LANCZOS)
        bb = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
        if not bb:
            print(f"  {png.name}: empty, skipped")
            continue
        pad = 4
        bb = (max(0, bb[0] - pad), max(0, bb[1] - pad), min(W, bb[2] + pad), min(H, bb[3] + pad))
        im.crop(bb).save(out_dir / png.name, optimize=True)
        boxes[f"assets/art/{png.name}"] = {"x": bb[0], "y": bb[1], "w": bb[2] - bb[0], "h": bb[3] - bb[1]}
        print(f"  {png.name}: x {bb[0]}, y {bb[1]}, w {bb[2] - bb[0]}, h {bb[3] - bb[1]}")
    updated = 0
    for page in cfg.get("pages", []):
        for layer in page.get("layers", []):
            if layer.get("src") in boxes:
                layer.update(boxes[layer["src"]])
                updated += 1
    write_json(d / "card.json", cfg)
    print(f"Cropped {len(boxes)} layers, updated {updated} positions in card.json.")
    if any(k.endswith(("tree.png", "cat.png")) for k in boxes):
        print("Note: tree-underlay.png and cat-fill.png are made from the tree and cat. Ask Claude to regenerate them if those changed shape.")


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *a):
        pass


def cmd_serve(args):
    handler = partial(NoCacheHandler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    base = f"http://localhost:{args.port}"
    print(f"Archive     {base}/")
    for d in sorted(p for p in YEARS.iterdir() if (p / "card.json").exists() and not p.name.startswith("_")):
        print(f"{d.name:<11} {base}/years/{d.name}/     edit mode {base}/years/{d.name}/?edit")
    print("Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


def main():
    p = argparse.ArgumentParser(description="Holiday card toolkit")
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("new", help="start a new card")
    s.add_argument("name", help="folder name, usually the year")
    s.add_argument("--from", dest="source", default="_template", help="copy from this card instead of the template")
    s.set_defaults(fn=cmd_new)

    s = sub.add_parser("serve", help="preview locally")
    s.add_argument("--port", type=int, default=8000)
    s.set_defaults(fn=cmd_serve)

    s = sub.add_parser("sync-engine", help="copy the latest engine into a draft card")
    s.add_argument("name")
    s.add_argument("--force", action="store_true")
    s.set_defaults(fn=cmd_sync_engine)

    s = sub.add_parser("stamp", help="write link-preview tags from card.json")
    s.add_argument("name")
    s.set_defaults(fn=cmd_stamp)

    s = sub.add_parser("publish", help="mark a card as published")
    s.add_argument("name")
    s.set_defaults(fn=cmd_publish)

    sub.add_parser("list", help="list cards").set_defaults(fn=cmd_list)

    s = sub.add_parser("crop-layers", help="crop full-canvas layer PNGs and update card.json")
    s.add_argument("name")
    s.set_defaults(fn=cmd_crop_layers)

    args = p.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
