"""OG cards for the /ventures/<slug>/ pages.

No artwork here, unlike the essay cards. A venture card is a nameplate: ivory
ground, amber hairline, the venture name set large in NHG Display, and the thesis
line under a marine rule. No role title: the card names the venture, not the
holder. The marine matches the record strip on the page itself.
"""
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont
import pathlib

SRC = pathlib.Path.home() / "jamestannahill-map/fonts"
OUT = pathlib.Path(__file__).resolve().parent.parent / "public"
TMP = pathlib.Path(__file__).parent / "ttf"
TMP.mkdir(exist_ok=True)

AMBER = (201, 136, 42)
MARINE = (29, 92, 99)
INK = (10, 10, 10)
BODY = (68, 68, 68)
IVORY = (242, 240, 235)
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


def card(slug, name, thesis):
    img = Image.new("RGB", (W, H), IVORY)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 6], fill=AMBER)

    f_eyebrow = ImageFont.truetype(MED, 21)
    f_name = ImageFont.truetype(BOLD, 72)
    f_thesis = ImageFont.truetype(ROMAN, 30)

    x, y = 90, 128
    tracked(d, (x, y), "VENTURES & PLATFORMS", f_eyebrow, AMBER, 6)

    y += 62
    for line in wrap(d, name, f_name, W - 180):
        d.text((x, y), line, font=f_name, fill=INK)
        y += 84

    y += 20
    d.rectangle([x, y, x + 62, y + 4], fill=MARINE)

    y += 40
    for line in wrap(d, thesis, f_thesis, 820):
        d.text((x, y), line, font=f_thesis, fill=BODY)
        y += 44

    url = "jamestannahill.com"
    f_url = ImageFont.truetype(BOLD, 24)
    w = d.textlength(url, font=f_url)
    d.text((W - 90 - w, H - 96), url, font=f_url, fill=AMBER)

    path = f"og-venture-{slug}.png"
    img.save(OUT / path, optimize=True)
    print("wrote", path, img.size, round((OUT / path).stat().st_size / 1024), "KB")


CARDS = [
    ("plocamium", "Plocamium Holdings",
     "Patient capital in the businesses that keep industry and care running."),
    ("prosec", "PROSEC Defense Group",
     "Readiness engineered before the crisis, not assembled during it."),
    ("rdlb", "RDLB",
     "Positioning built as infrastructure, for firms whose product is trust."),
    ("1ness", "1ness Strategies",
     "Growth systems for industries where the rules are the hard part."),
    ("newyorklab", "NewYorkLab",
     "Instrumenting the city so its decisions can be made on evidence."),
]

for c in CARDS:
    card(*c)
