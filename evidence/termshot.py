"""Render a text file as a dark terminal-style PNG (used for report evidence)."""
import re
import sys
from PIL import Image, ImageDraw, ImageFont

src, dst, title = sys.argv[1], sys.argv[2], sys.argv[3]
font = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 22)
lines = open(src, encoding="utf-8", errors="replace").read().rstrip("\n").split("\n")
lh, pad, bar = 30, 28, 46
width = max(int(font.getlength(l)) for l in lines + [title]) + pad * 2
width = max(width, 1100)
img = Image.new("RGB", (width, bar + pad + lh * len(lines) + pad), "#0d1117")
d = ImageDraw.Draw(img)
d.rectangle([0, 0, width, bar], fill="#21262d")
for i, c in enumerate(("#ff5f56", "#ffbd2e", "#27c93f")):
    d.ellipse([pad + i * 30, 15, pad + i * 30 + 16, 31], fill=c)
d.text((pad + 110, 10), title, font=font, fill="#8b949e")
y = bar + pad
for l in lines:
    color = "#c9d1d9"
    if l.startswith("$"):
        color = "#7ee787"
    elif re.search(r"(?<![A-Za-z=])(HIGH|CRITICAL)(?![A-Za-z=])", l) or re.search(r"\b(FAIL|error)\b", l):
        color = "#ff7b72"
    elif re.search(r"(?<![A-Za-z=])MEDIUM(?![A-Za-z=])", l):
        color = "#d29922"
    elif "TOTAL=0" in l or "0 failed" in l:
        color = "#7ee787"
    d.text((pad, y), l, font=font, fill=color)
    y += lh
img.save(dst)
print("saved", dst)
