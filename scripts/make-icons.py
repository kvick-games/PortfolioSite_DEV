"""Builds the site icon: a cube in single white lines on a dark tile.

Writes public/favicon.svg, public/favicon.ico (16, 32, 48), public/apple-touch-icon.png
(180) and public/icon-512.png. Small sizes get a heavier line so the cube survives at 16 px.
Run: python scripts/make-icons.py
"""
import math
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public"
TILE = (12, 13, 15)
LINE = (236, 233, 226)
SS = 8  # supersampling


def cube(cx: float, cy: float, r: float):
    """Hexagon outline and the near corner's three edges of an isometric cube."""
    hexagon = [(cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a)))
               for a in (-90, -30, 30, 90, 150, 210)]
    spokes = [hexagon[5], hexagon[1], hexagon[3]]
    return hexagon, spokes


def svg() -> str:
    # Browsers draw this one in the tab, at 16 px: a large cube and a firm line.
    hexagon, spokes = cube(32, 32, 21)
    fmt = lambda p: f"{p[0]:.2f} {p[1]:.2f}"
    outline = "M" + " L".join(fmt(p) for p in hexagon) + " Z"
    inner = " ".join(f"M32 32 L{fmt(p)}" for p in spokes)
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">\n'
        f'  <rect width="64" height="64" rx="14" fill="#{bytes(TILE).hex()}"/>\n'
        f'  <path d="{outline} {inner}" fill="none" stroke="#{bytes(LINE).hex()}" stroke-width="3.6"'
        ' stroke-linejoin="round" stroke-linecap="round"/>\n'
        "</svg>\n"
    )


def raster(size: int, line: float, r: float = 18.5, radius: float = 14 / 64, tile: bool = True) -> Image.Image:
    s = size * SS
    image = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    if tile:
        draw.rounded_rectangle((0, 0, s - 1, s - 1), radius=radius * s, fill=TILE + (255,))
    else:
        draw.rectangle((0, 0, s, s), fill=TILE + (255,))
    k = s / 64
    cy = 32 + (r - 21) * -0.03  # optical centre: a touch low for small cubes
    hexagon, spokes = cube(32 * k, cy * k, r * k)
    w = line * k
    draw.line(hexagon + [hexagon[0], hexagon[1]], fill=LINE, width=round(w), joint="curve")
    for p in spokes:
        draw.line([(32 * k, cy * k), p], fill=LINE, width=round(w))
    for x, y in hexagon + [(32 * k, cy * k)]:
        draw.ellipse((x - w / 2, y - w / 2, x + w / 2, y + w / 2), fill=LINE)
    return image.resize((size, size), Image.LANCZOS)


OUT.mkdir(exist_ok=True)
(OUT / "favicon.svg").write_text(svg(), encoding="utf-8")
# Tab sizes: a larger cube and a heavier line, so it survives at 16 px.
icons = [raster(16, 5.6, r=23.5), raster(32, 4.2, r=22), raster(48, 3.6, r=21)]
icons[2].save(OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=icons[:2])
# iOS rounds the corners itself, so the touch icon is a full square.
raster(180, 2.4, tile=False).convert("RGB").save(OUT / "apple-touch-icon.png")
raster(512, 2.2).save(OUT / "icon-512.png")
print("wrote", ", ".join(p.name for p in sorted(OUT.glob("*icon*"))))
