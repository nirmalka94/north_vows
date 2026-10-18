#!/usr/bin/env python3
"""
Compress the photos in Photo_carousel/ for the web — run it after adding photos.

    python3 tools/compress_carousel.py

For every photo that is too large (over MAX_EDGE pixels or MAX_KB kilobytes):
  1. the untouched original is copied to Photo_carousel_originals/ (kept out of git
     and not uploaded to the website), then
  2. the photo in Photo_carousel/ is replaced by a web-sized JPEG
     (longest side MAX_EDGE px, quality JPEG_QUALITY, camera rotation applied,
     metadata removed).
Photos that are already small are left alone, so running it again is safe.
Requires Pillow (pip install Pillow).
"""
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
CAROUSEL = ROOT / "Photo_carousel"
BACKUP = ROOT / "Photo_carousel_originals"
SKIP_DIRS = {"_web", "_removed"}
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

MAX_EDGE = 2000      # px, longest side — sharp in the full-screen viewer, light to load
MAX_KB = 600         # files above this are recompressed
JPEG_QUALITY = 82


def needs_compression(path: Path, img: Image.Image) -> bool:
    return max(img.size) > MAX_EDGE or path.stat().st_size > MAX_KB * 1024


def compress(path: Path) -> tuple[int, int] | None:
    with Image.open(path) as img:
        if not needs_compression(path, img):
            return None
        img = ImageOps.exif_transpose(img)          # apply camera rotation
        if img.mode not in ("RGB", "L"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img, mask=img.getchannel("A") if "A" in img.getbands() else None)
            img = background
        img.thumbnail((MAX_EDGE, MAX_EDGE), Image.LANCZOS)

        # Keep the untouched original outside the website
        backup = BACKUP / path.relative_to(CAROUSEL)
        if not backup.exists():
            backup.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, backup)

        before = path.stat().st_size
        target = path if path.suffix.lower() in (".jpg", ".jpeg") else path.with_suffix(".jpg")
        tmp = target.with_name(target.name + ".tmp")
        img.convert("RGB").save(tmp, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
        tmp.replace(target)
        if target != path:
            path.unlink()
        return before, target.stat().st_size


def main() -> int:
    if not CAROUSEL.is_dir():
        print(f"No folder at {CAROUSEL}")
        return 1
    total_before = total_after = changed = 0
    for path in sorted(CAROUSEL.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in EXTENSIONS:
            continue
        if SKIP_DIRS.intersection(path.relative_to(CAROUSEL).parts):
            continue
        result = compress(path)
        rel = path.relative_to(CAROUSEL)
        if result is None:
            print(f"  ok        {rel}")
            continue
        before, after = result
        changed += 1
        total_before += before
        total_after += after
        print(f"  compressed {rel}: {before / 1024:,.0f} KB -> {after / 1024:,.0f} KB")
    if changed:
        print(f"\n{changed} photo(s): {total_before / 1048576:.1f} MB -> {total_after / 1048576:.1f} MB"
              f"  (originals kept in {BACKUP.name}/)")
    else:
        print("\nAll photos are already web-sized.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
