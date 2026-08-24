"""OG card for /profile: split panel. Full-bleed headshot on the right
behind an amber divider, ink type panel on the left (tracked eyebrow,
NHG Display headline, amber rule, grey standfirst, amber URL).
"""
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont
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

shot = Image.open(OUT / "headshot.jpg").convert("RGB")
scale = H / shot.height
sw = round(shot.width * scale)
shot = shot.resize((sw, H), Image.LANCZOS)
panel = 660
left = max(0, (sw - (W - panel)) // 2)
img.paste(shot.crop((left, 0, left + (W - panel), H)), (panel, 0))

d = ImageDraw.Draw(img)
d.rectangle([panel - 6, 0, panel - 1, H], fill=AMBER)

f_eyebrow = ImageFont.truetype(MED, 21)
f_name = ImageFont.truetype(BOLD, 72)
f_sub = ImageFont.truetype(ROMAN, 26)
f_url = ImageFont.truetype(BOLD, 24)

tracked(d, (80, 150), "JAMES TANNAHILL", f_eyebrow, AMBER, 6)
d.text((80, 205), "Executive", font=f_name, fill=WHITE)
d.text((80, 285), "Profile", font=f_name, fill=WHITE)
d.rectangle([80, 400, 142, 404], fill=AMBER)
d.text((80, 430), "Investor, operator, and builder.", font=f_sub, fill=GREY)
d.text((80, 466), "One page, PDF.", font=f_sub, fill=GREY)
d.text((80, H - 84), "jamestannahill.com/profile", font=f_url, fill=AMBER)

img.save(OUT / "og-profile.png", optimize=True)
print("wrote og-profile.png", img.size)
