"""OG card for /contact: ivory nameplate matching the venture cards."""
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont
import pathlib

SRC = pathlib.Path.home() / "jamestannahill-map/fonts"
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public"
TMP = pathlib.Path(__file__).parent / "ttf"
TMP.mkdir(exist_ok=True)

AMBER = (201, 136, 42)
MARINE = (29, 92, 99)
INK = (10, 10, 10)
BODY = (68, 68, 68)
IVORY = (242, 240, 235)
RAMP = [
    (207, 225, 226),
    (168, 201, 204),
    (113, 165, 170),
    (62, 127, 135),
    (35, 94, 102),
    (15, 59, 67),
]
W, H = 1200, 630
RAIL = 56


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


def wrap(draw, text, font, width):
    lines, line = [], ""
    for word in text.split():
        trial = (line + " " + word).strip()
        if draw.textlength(trial, font=font) <= width:
            line = trial
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


img = Image.new("RGB", (W, H), IVORY)
d = ImageDraw.Draw(img)
step = H / len(RAMP)
for n, colour in enumerate(RAMP):
    d.rectangle([W - RAIL, round(n * step), W, round((n + 1) * step)], fill=colour)
d.rectangle([0, 0, W, 6], fill=AMBER)

f_eyebrow = ImageFont.truetype(MED, 21)
f_name = ImageFont.truetype(BOLD, 72)
f_thesis = ImageFont.truetype(ROMAN, 30)
f_url = ImageFont.truetype(BOLD, 24)

x, y = 90, 128
tracked(d, (x, y), "CONTACT", f_eyebrow, AMBER, 6)
y += 62
d.text((x, y), "Get in Touch.", font=f_name, fill=INK)
y += 104
d.rectangle([x, y, x + 62, y + 4], fill=MARINE)
y += 40
for line in wrap(d, "Confidential inquiries for founder-led and PE-backed companies.", f_thesis, 780):
    d.text((x, y), line, font=f_thesis, fill=BODY)
    y += 44

url = "jamestannahill.com/contact"
w = d.textlength(url, font=f_url)
d.text((W - RAIL - 34 - w, H - 78), url, font=f_url, fill=AMBER)

img.save(OUT / "og-contact.png", optimize=True)
print("wrote og-contact.png", img.size)
