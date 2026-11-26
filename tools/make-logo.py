"""Draws the KnockLock logo and app icons as SVG files in assets/.

The mark is a padlock: the shackle is two beamed eighth-note stems, and the
keyhole is a notehead with its stem. The word mark uses Playfair Display Bold,
turned into outlines so the SVG looks the same everywhere.

Run: python3 tools/make-logo.py   (needs: pip install fonttools brotli)
"""
import pathlib
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

root = pathlib.Path(__file__).resolve().parent.parent
assets = root / 'assets'
INK, NAVY, NAVY_LIGHT, WHITE = '#14181f', '#1f3a5f', '#8fb0dc', '#ffffff'


def mark(fg, cut, x=0, y=0, s=1.0):
    """Padlock glyph in a 512 box. fg is the lock colour, cut is the colour behind the keyhole."""
    t = f'translate({x} {y}) scale({s})'
    return f'''<g transform="{t}">
    <path fill="{fg}" d="M156 92L356 76v54L156 146z"/>
    <path fill="{fg}" d="M156 100h24v172h-24zM332 86h24v186h-24z"/>
    <rect fill="{fg}" x="112" y="236" width="288" height="196" rx="34"/>
    <ellipse fill="{cut}" cx="256" cy="310" rx="36" ry="27" transform="rotate(-22 256 310)"/>
    <path fill="{cut}" d="M245 318h22l9 64h-40z"/>
  </g>'''


def word(text_parts, size, x, y):
    """Outlines of the word mark. text_parts: [(text, colour)]. Returns (svg, width)."""
    font = TTFont(assets / 'fonts' / 'PlayfairDisplay-700.woff2')
    gs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font['hmtx']
    upm = font['head'].unitsPerEm
    k = size / upm
    out, pen_x = [], 0.0
    for text, colour in text_parts:
        d = []
        for ch in text:
            g = cmap[ord(ch)]
            sp = SVGPathPen(gs)
            gs[g].draw(TransformPen(sp, (k, 0, 0, -k, x + pen_x, y)))
            d.append(sp.getCommands())
            pen_x += hmtx[g][0] * k
        out.append(f'<path fill="{colour}" d="{" ".join(d)}"/>')
    return '\n  '.join(out), pen_x


def svg(w, h, body, title='KnockLock'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{title}">\n  <title>{title}</title>\n  {body}\n</svg>\n'


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)
    print(path.relative_to(root))


icons = assets / 'icons'
# App icon: graphite tile, white lock.
write(icons / 'icon.svg', svg(512, 512, f'<rect width="512" height="512" rx="112" fill="{INK}"/>\n  ' + mark(WHITE, INK)))
# Favicon: same, with the lock a little larger so it reads at 16 px.
write(icons / 'favicon.svg', svg(512, 512, f'<rect width="512" height="512" rx="104" fill="{INK}"/>\n  ' + mark(WHITE, INK, -38, -30, 1.15)))
# Maskable icon: full bleed, lock inside the safe zone.
write(icons / 'icon-maskable.svg', svg(512, 512, f'<rect width="512" height="512" fill="{INK}"/>\n  ' + mark(WHITE, INK, 51, 51, 0.8)))
# Mark on its own, for light backgrounds.
write(assets / 'logo-mark.svg', svg(512, 512, mark(INK, WHITE)))

# Logo: icon tile plus word mark, for light and dark backgrounds.
for name, ink, accent, tile, lock in (('logo.svg', INK, NAVY, INK, WHITE), ('logo-dark.svg', '#f2f4f7', NAVY_LIGHT, '#f2f4f7', INK)):
    tile_size, gap, size = 120, 34, 118
    words, width = word([('Knock', ink), ('Lock', accent)], size, tile_size + gap, 103)
    body = f'<rect width="{tile_size}" height="{tile_size}" rx="27" fill="{tile}"/>\n  {mark(lock, tile, 0, 0, tile_size / 512)}\n  {words}'
    write(assets / name, svg(round(tile_size + gap + width + 4), tile_size, body))
