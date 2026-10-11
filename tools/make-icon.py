#!/usr/bin/env python3
"""Draws a cartoon Trump head icon (512x512) and a preview PNG."""
import os
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets')
os.makedirs(OUT, exist_ok=True)

W = H = 512
img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

SKIN = (242, 166, 90, 255)
SKIN_D = (232, 146, 74, 255)
HAIR = (244, 201, 93, 255)
BROW = (43, 43, 51, 255)
DARK = (30, 30, 42, 255)
WHITE = (255, 255, 255, 255)
TIE = (192, 39, 45, 255)
SUIT = (43, 58, 103, 255)
SHIRT = (245, 239, 224, 255)

# ears
d.ellipse((110, 230, 150, 300), fill=SKIN)
d.ellipse((362, 230, 402, 300), fill=SKIN)
# face
d.ellipse((110, 130, 402, 420), fill=SKIN)

# hair: a swooping cap — thick arc over the top
d.pieslice((108, 105, 404, 360), start=180, end=360, fill=HAIR)
# hairline swoop (a band curving across the forehead)
d.chord((118, 150, 394, 330), start=180, end=360, fill=HAIR)
# side strand
d.line((388, 200, 370, 150), fill=HAIR, width=18)

# brows
d.rounded_rectangle((180, 205, 250, 218), radius=6, fill=BROW)
d.rounded_rectangle((262, 205, 332, 218), radius=6, fill=BROW)

# eyes (white + pupils)
for cx in (215, 297):
    d.ellipse((cx - 18, 230, cx + 18, 268), fill=WHITE)
    d.ellipse((cx - 9, 238, cx + 9, 258), fill=DARK)
    d.ellipse((cx - 6, 238, cx - 1, 245), fill=WHITE)

# nose
d.ellipse((240, 282, 272, 308), fill=SKIN_D)

# smile
d.arc((210, 305, 300, 350), start=20, end=160, fill=(138, 58, 46, 255), width=7)

# collar + tie (bottom of icon)
d.polygon([(200, 512), (256, 430), (312, 512)], fill=SUIT)
d.polygon([(236, 430), (276, 430), (256, 470)], fill=SHIRT)
d.polygon([(244, 440), (268, 440), (264, 512), (248, 512)], fill=TIE)

img.save(os.path.join(OUT, 'icon.png'))
img.save(os.path.join(OUT, 'pet-preview.png'))
print('wrote assets/icon.png and assets/pet-preview.png')
