"""Generates the Android launcher icons from the app's dumbbell-and-track artwork (src/app/icon.svg).

Run from the repo root:  python scripts/generate-android-icons.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

RES = Path(__file__).resolve().parent.parent / "android/app/src/main/res"
BG = (9, 9, 11, 255)
GREEN = (16, 185, 129, 255)
GREY = (161, 161, 170, 255)
AMBER = (245, 158, 11, 255)
SS = 4  # supersampling for smooth edges

# (mipmap folder, legacy icon px, adaptive layer px)
DENSITIES = [("mdpi", 48, 108), ("hdpi", 72, 162), ("xhdpi", 96, 216), ("xxhdpi", 144, 324), ("xxxhdpi", 192, 432)]


def artwork(draw: ImageDraw.ImageDraw, k: float, ox: float, oy: float) -> None:
    """Draws the 64x64-grid artwork scaled by k with its origin at (ox, oy)."""

    def rect(x, y, w, h, r, fill):
        draw.rounded_rectangle([ox + x * k, oy + y * k, ox + (x + w) * k, oy + (y + h) * k], radius=r * k, fill=fill)

    rect(10, 27, 6, 10, 2, GREEN)
    rect(16, 22, 6, 20, 2, GREEN)
    rect(22, 30, 20, 4, 2, GREY)
    rect(42, 22, 6, 20, 2, GREEN)
    rect(48, 27, 6, 10, 2, GREEN)
    # Quadratic curve M14 48 Q32 56 50 48 (a smile under the dumbbell) as a polyline with round ends.
    pts = []
    for i in range(41):
        t = i / 40
        x = (1 - t) ** 2 * 14 + 2 * (1 - t) * t * 32 + t**2 * 50
        y = (1 - t) ** 2 * 48 + 2 * (1 - t) * t * 56 + t**2 * 48
        pts.append((ox + x * k, oy + y * k))
    w = 3 * k
    draw.line(pts, fill=AMBER, width=round(w), joint="curve")
    for px, py in (pts[0], pts[-1]):
        draw.ellipse([px - w / 2, py - w / 2, px + w / 2, py + w / 2], fill=AMBER)


def legacy(size: int, round_icon: bool) -> Image.Image:
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if round_icon:
        d.ellipse([0, 0, s - 1, s - 1], fill=BG)
        k = s / 64 * 0.82  # keep the artwork inside the circle
        artwork(d, k, (s - 64 * k) / 2, (s - 64 * k) / 2)
    else:
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=s * 14 / 64, fill=BG)
        artwork(d, s / 64, 0, 0)
    return img.resize((size, size), Image.LANCZOS)


def foreground(size: int) -> Image.Image:
    """Adaptive-icon foreground: transparent, artwork centred inside the 66/108 safe zone."""
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    k = 0.52 * s / 44  # artwork spans 44 grid units horizontally
    # Artwork centre is about (32, 37) on the 64 grid.
    artwork(ImageDraw.Draw(img), k, s / 2 - 32 * k, s / 2 - 37 * k)
    return img.resize((size, size), Image.LANCZOS)


for name, legacy_px, layer_px in DENSITIES:
    folder = RES / f"mipmap-{name}"
    legacy(legacy_px, False).save(folder / "ic_launcher.png")
    legacy(legacy_px, True).save(folder / "ic_launcher_round.png")
    foreground(layer_px).save(folder / "ic_launcher_foreground.png")

(RES / "values/ic_launcher_background.xml").write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#09090B</color>\n</resources>\n',
    encoding="utf-8",
)
print("icons written")
