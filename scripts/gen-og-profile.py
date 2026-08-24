"""OG card for /profile: dark ink ground, amber hairline, tracked eyebrow,
NHG Display headline, amber rule, grey standfirst, amber URL, with the
headshot in a circle on the right. Same furniture as the thoughts cards.
"""
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont, ImageOps
import pathlib

SRC = pathlib.Path.home() / "jamestannahill-map/fonts"
OUT = pathlib.Path.home() / "jamestannahill-com/public"
TMP = pathlib.Path(__file__).parent / "ttf"
TMP.mkdir(exist_ok=True)

AMBER = (201, 136, 42)
WHITE = (255, 255, 255)
GREY = (188, 188, 188)
INK = (10, 10, 10)
W, H = 1200, 630


def ttf(name):
    dst = TMP / (name + ".ttf")
    if not dst.exists():
        f = TTFont(SRC / (name + ".woff2"))
        f.flavor = None
        f.save(dst)
    return str(dst)


BOLD, MED, ROMAN = ttf("NHGDisplay-Bold"), ttf("NHGDisplay-Medium"), ttf("NHGDisplay-Roman")


def tracked(draw, xy, text, font, fill, tracking):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking


img = Image.new("RGB", (W, H), INK)
d = ImageDraw.Draw(img)
d.rectangle([0, 0, W, 6], fill=AMBER)

# Headshot in a circle on the right, with a thin amber ring.
shot = Image.open(OUT / "headshot.jpg").convert("RGB")
side = min(shot.size)
shot = shot.crop((
    (shot.width - side) // 2,
    (shot.height - side) // 2,
    (shot.width + side) // 2,
    (shot.height + side) // 2,
))
DIA = 300
shot = shot.resize((DIA, DIA), Image.LANCZOS)
mask = Image.new("L", (DIA * 4, DIA * 4), 0)
ImageDraw.Draw(mask).ellipse([0, 0, DIA * 4, DIA * 4], fill=255)
mask = mask.resize((DIA, DIA), Image.LANCZOS)
cx, cy = W - 90 - DIA, (H - DIA) // 2
img.paste(shot, (cx, cy), mask)
d.ellipse([cx - 3, cy - 3, cx + DIA + 3, cy + DIA + 3], outline=AMBER, width=3)

f_eyebrow = ImageFont.truetype(MED, 21)
f_title = ImageFont.truetype(BOLD, 76)
f_sub = ImageFont.truetype(ROMAN, 27)
f_url = ImageFont.truetype(BOLD, 27)

x, y = 90, 132
tracked(d, (x, y), "JAMES TANNAHILL", f_eyebrow, AMBER, 6)

y += 56
for line in ("Executive", "Profile"):
    d.text((x, y), line, font=f_title, fill=WHITE)
    y += 88

y += 18
d.rectangle([x, y, x + 62, y + 4], fill=AMBER)

y += 38
for line in ("Investor, operator, and builder.", "One page, PDF."):
    d.text((x, y), line, font=f_sub, fill=GREY)
    y += 40

d.text((90, H - 90), "jamestannahill.com/profile", font=f_url, fill=AMBER)

img.save(OUT / "og-profile.png", optimize=True)
print("wrote og-profile.png", img.size)
