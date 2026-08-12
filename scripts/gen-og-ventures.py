"""OG cards for the /ventures/<slug>/ pages.

No artwork here, unlike the essay cards. A venture card is a nameplate on ivory:
amber hairline at the top, the venture name set large in NHG Display, the thesis
under a marine rule, and the venture's own logo in the bottom left so a pasted
link is recognisable before it is read. No role title: the card names the
venture, not the holder.

The right edge carries the same marine ramp the Competencies section uses on the
site, cool at the top and deep at the bottom, which is what ties an unfurled
link back to the page it came from.
"""
from fontTools.ttLib import TTFont
from PIL import Image, ImageChops, ImageDraw, ImageFont
import pathlib

SRC = pathlib.Path.home() / "jamestannahill-map/fonts"
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public"
LOGOS = ROOT / "public/logos"
TMP = pathlib.Path(__file__).parent / "ttf"
TMP.mkdir(exist_ok=True)

AMBER = (201, 136, 42)
MARINE = (29, 92, 99)
INK = (10, 10, 10)
BODY = (68, 68, 68)
IVORY = (242, 240, 235)
# Cool to deep, the same seven steps the Competencies rows mix between.
RAMP = [
    (207, 225, 226),
    (168, 201, 204),
    (113, 165, 170),
    (62, 127, 135),
    (35, 94, 102),
    (15, 59, 67),
]
W, H = 1200, 630
RAIL = 56  # width of the ramp rail on the right edge


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


def rail(img):
    """The marine ramp down the right edge, one block per step."""
    d = ImageDraw.Draw(img)
    step = H / len(RAMP)
    for n, colour in enumerate(RAMP):
        d.rectangle([W - RAIL, round(n * step), W, round((n + 1) * step)], fill=colour)


def logo(img, slug, box_h=62):
    """Flatten the venture logo onto ivory at a fixed height, bottom left.

    Returns the width drawn, or 0 when the venture has no logo file, so the
    caller can fall back to setting its name instead.
    """
    path = LOGOS / f"{slug}.png"
    if not path.exists():
        return 0
    src = Image.open(path).convert("RGBA")
    scale = box_h / src.height
    src = src.resize((max(1, round(src.width * scale)), box_h), Image.LANCZOS)

    # Flatten onto white, then multiply into the ivory ground. Same result as
    # the site's mix-blend-mode: multiply, so logos supplied on a white plate
    # (RDLB, NewYorkLab) do not stamp a white box onto the card.
    white = Image.new("RGBA", src.size, (255, 255, 255, 255))
    flat = Image.alpha_composite(white, src).convert("RGB")
    box = (90, H - 90 - box_h, 90 + src.width, H - 90)
    img.paste(ImageChops.multiply(img.crop(box), flat), box)
    return src.width


def card(slug, name, thesis, logo_file=None):
    img = Image.new("RGB", (W, H), IVORY)
    rail(img)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 6], fill=AMBER)

    f_eyebrow = ImageFont.truetype(MED, 21)
    f_name = ImageFont.truetype(BOLD, 72)
    f_thesis = ImageFont.truetype(ROMAN, 30)

    text_w = W - 180 - RAIL

    x, y = 90, 128
    tracked(d, (x, y), "VENTURES & PLATFORMS", f_eyebrow, AMBER, 6)

    y += 62
    for line in wrap(d, name, f_name, text_w):
        d.text((x, y), line, font=f_name, fill=INK)
        y += 84

    y += 20
    d.rectangle([x, y, x + 62, y + 4], fill=MARINE)

    y += 40
    for line in wrap(d, thesis, f_thesis, 780):
        d.text((x, y), line, font=f_thesis, fill=BODY)
        y += 44

    # Bottom left: the venture's own mark, when it has one. logo_file=None
    # means no mark, rather than falling back to a file named for the slug.
    if logo_file:
        logo(img, logo_file)

    url = "jamestannahill.com"
    f_url = ImageFont.truetype(BOLD, 24)
    w = d.textlength(url, font=f_url)
    d.text((W - RAIL - 34 - w, H - 78), url, font=f_url, fill=AMBER)

    path = f"og-venture-{slug}.png"
    img.save(OUT / path, optimize=True)
    print("wrote", path, img.size, round((OUT / path).stat().st_size / 1024), "KB")


CARDS = [
    ("plocamium", "Plocamium Holdings",
     "Patient capital in the businesses that keep industry and care running.",
     "plocamium"),
    ("prosec", "PROSEC Defense Group",
     "Readiness engineered before the crisis, not assembled during it.",
     None),
    ("rdlb", "RDLB",
     "Positioning built as infrastructure, for firms whose product is trust.",
     "rdlb"),
    ("1ness", "1ness Strategies",
     "Growth systems for industries where the rules are the hard part.",
     "1nessagency"),
    ("newyorklab", "NewYorkLab",
     "Instrumenting the city so its decisions can be made on evidence.",
     "newyorklab"),
    ("nargusta", "Nargusta",
     "A letter of introduction, carried the way sailors have always carried one.",
     "nargusta"),
    ("gooovy", "gOOOvy",
     "The out of office reply that text messaging never got.",
     "gooovy"),
    ("art-generator", "Art.",
     "The weather, rendered daily, by a hand that is not the same hand twice.",
     None),
]

for c in CARDS:
    card(*c)
