"""OG cards: each essay's own artwork as a blended ground under the title.

The artwork is cover-cropped to 1200x630, darkened, and veiled by a horizontal
gradient that is near-opaque on the left where the type sits and thins out to
the right so the painting stays readable as a painting. Same furniture as the
first cards: amber hairline, tracked eyebrow, NHG Display headline, amber rule,
grey standfirst, amber URL.
"""
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
import pathlib

SRC = pathlib.Path.home() / "jamestannahill-map/fonts"
ART = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path.home() / "jamestannahill-com/public"
TMP = pathlib.Path(__file__).parent / "ttf"
TMP.mkdir(exist_ok=True)

AMBER = (201, 136, 42)
WHITE = (255, 255, 255)
GREY = (188, 188, 188)
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


def cover(img, w, h):
    """Scale to fill w x h, centre-crop the overflow."""
    scale = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left = (img.width - w) // 2
    top = (img.height - h) // 2
    return img.crop((left, top, left + w, top + h))


def veil(base):
    """Two veils: horizontal (0.93 left to 0.40 right) so the type reads, plus a
    bottom-up fade so the URL sits on darkness without a hard plate."""
    hor = Image.new("L", (W, 1))
    for x in range(W):
        t = x / (W - 1)
        hor.putpixel((x, 0), int(255 * (0.93 - 0.53 * t)))
    mask = hor.resize((W, H)).load()

    m = Image.new("L", (W, H))
    px = m.load()
    for y in range(H):
        # Bottom fade starts at 62% height and reaches 0.72 at the very bottom.
        v = (y - 0.62 * H) / (0.38 * H)
        bot = 0.72 * max(0.0, v) ** 1.6
        for x in range(W):
            a = mask[x, y] / 255.0
            px[x, y] = int(255 * min(1.0, a + bot * (1 - a)))

    ink = Image.new("RGB", (W, H), (10, 10, 10))
    return Image.composite(ink, base, m)


def card(path, artwork, eyebrow, title_lines, standfirst_lines, url):
    art = Image.open(ART / artwork).convert("RGB")
    img = cover(art, W, H)
    img = ImageEnhance.Color(img).enhance(0.82)
    img = ImageEnhance.Brightness(img).enhance(0.86)
    img = veil(img)

    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 6], fill=AMBER)

    f_eyebrow = ImageFont.truetype(MED, 21)
    f_title = ImageFont.truetype(BOLD, 76)
    f_sub = ImageFont.truetype(ROMAN, 27)
    f_url = ImageFont.truetype(BOLD, 27)

    x, y = 90, 132
    tracked(d, (x, y), eyebrow.upper(), f_eyebrow, AMBER, 6)

    y += 56
    for line in title_lines:
        d.text((x, y), line, font=f_title, fill=WHITE)
        y += 88

    y += 18
    d.rectangle([x, y, x + 62, y + 4], fill=AMBER)

    y += 38
    for line in standfirst_lines:
        d.text((x, y), line, font=f_sub, fill=GREY)
        y += 40

    w = d.textlength(url, font=f_url)
    d.text((W - 90 - w, H - 90), url, font=f_url, fill=AMBER)

    img.save(OUT / path, optimize=True)
    print("wrote", path, img.size, round((OUT / path).stat().st_size / 1024), "KB")


card(
    "og-guerir-quelquefois.png",
    "art-region-45s-80e.png",
    "Thoughts",
    ["Guérir", "Quelquefois"],
    ["On the word “cure,” and the men who sell it."],
    "jamestannahill.com/thoughts",
)

card(
    "og-the-unsmiling-class.png",
    "art-region-60s-0e.png",
    "Thoughts",
    ["The Unsmiling", "Class"],
    ["On the finance headshot, and the face", "it has agreed to wear."],
    "jamestannahill.com/thoughts",
)

card(
    "og-thoughts.png",
    "art-tropical-south-america-15s-70w.png",
    "Thoughts",
    ["Occasional", "Essays"],
    ["Markets, medicine, and the language", "both are written in."],
    "jamestannahill.com/thoughts",
)

card(
    "og-sea-room.png",
    "art-b-region-60s-0e.png",
    "Thoughts",
    ["Sea", "Room"],
    ["On knowing where you are, and having", "somewhere to go."],
    "jamestannahill.com/thoughts",
)

card(
    "og-party-secretary.png",
    "e-south.png",
    "Thoughts",
    ["Ask Who the", "Party Secretary Is"],
    ["On an adversary that files its", "intentions publicly."],
    "jamestannahill.com/thoughts",
)
