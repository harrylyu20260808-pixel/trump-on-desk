#!/usr/bin/env python3
"""Generates animated GIF previews (pixel Trump) for the README."""
import os
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets')
os.makedirs(OUT, exist_ok=True)

S = 8  # pixel size
W = H = 200

SKIN = (242, 166, 90)
HAIR = (244, 201, 93)
SUIT = (43, 58, 103)
TIE = (192, 39, 45)
SHIRT = (245, 239, 224)
DARK = (30, 30, 42)
WHITE = (255, 255, 255)
NONE = (0, 0, 0, 0)

def px(d, x, y, w, h, c):
    d.rectangle([x * S, y * S, (x + w) * S - 1, (y + h) * S - 1], fill=c)

def frame(head_tilt=0, arms=(0, 0), mouth='smile', eyes=True):
    img = Image.new('RGBA', (W, H), NONE)
    d = ImageDraw.Draw(img)
    # body
    px(d, 15, 19, 10, 8, SUIT)          # suit block
    px(d, 17, 19, 3, 2, SHIRT)          # shirt
    px(d, 18, 19, 2, 4, TIE)            # tie
    # arms (offset y by arms)
    px(d, 12, 19 + arms[0], 2, 6, SUIT)
    px(d, 26, 19 + arms[1], 2, 6, SUIT)
    # head group translated for tilt (simple vertical)
    hy = int(head_tilt)
    px(d, 11, 10 + hy, 3, 1, SKIN)      # ear L
    px(d, 26, 10 + hy, 3, 1, SKIN)      # ear R
    px(d, 13, 6 + hy, 13, 8, SKIN)      # face
    px(d, 13, 6 + hy, 13, 2, HAIR)      # hair cap
    px(d, 14, 8 + hy, 8, 1, HAIR)       # side swoosh
    px(d, 14, 9 + hy, 3, 1, DARK)       # brow L
    px(d, 21, 9 + hy, 3, 1, DARK)       # brow R
    if eyes:
        px(d, 15, 10 + hy, 2, 2, WHITE); px(d, 16, 10 + hy, 1, 1, DARK)
        px(d, 21, 10 + hy, 2, 2, WHITE); px(d, 22, 10 + hy, 1, 1, DARK)
    else:
        px(d, 15, 11 + hy, 3, 1, DARK)
        px(d, 21, 11 + hy, 3, 1, DARK)
    # nose
    px(d, 18, 12 + hy, 2, 1, (232, 146, 74))
    # mouth
    if mouth == 'smile':
        px(d, 17, 14 + hy, 5, 1, (138, 58, 46))
    elif mouth == 'open':
        px(d, 18, 13 + hy, 3, 2, (90, 42, 34))
    elif mouth == 'grin':
        px(d, 17, 13 + hy, 5, 2, (90, 42, 34))
    elif mouth == 'frown':
        px(d, 17, 14 + hy, 5, 1, (138, 58, 46))
    return img.convert('P', palette=Image.ADAPTIVE)

# Demo GIF: idle -> thinking -> working -> celebrate loop
frames = []
for _ in range(6):
    frames.append(frame(head_tilt=0, arms=(0, 0), mouth='smile'))
    frames.append(frame(head_tilt=0, arms=(0, 0), mouth='smile'))
for _ in range(8):
    frames.append(frame(head_tilt=-1, arms=(0, 0), mouth='open'))
for _ in range(10):
    frames.append(frame(head_tilt=0, arms=(0, 0), mouth='open'))
    frames.append(frame(head_tilt=0, arms=(-1, 0), mouth='open'))
    frames.append(frame(head_tilt=0, arms=(0, -1), mouth='open'))
for _ in range(6):
    frames.append(frame(head_tilt=0, arms=(0, -3), mouth='grin'))
    frames.append(frame(head_tilt=0, arms=(0, 0), mouth='grin'))

frames[0].save(
    os.path.join(OUT, 'demo.gif'),
    save_all=True, append_images=frames[1:], duration=220, loop=0, disposal=2,
)
print('wrote assets/demo.gif')
