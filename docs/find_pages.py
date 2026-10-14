"""Find the printed page number of every heading in a rendered PDF.

usage: find_pages.py report.pdf headings.json out.json
Body pages are numbered from the page where the first heading appears as an exact line.
"""
import json
import subprocess
import sys

pdf, heads_path, out = sys.argv[1:4]
heads = json.load(open(heads_path))
n = int(subprocess.check_output(["pdfinfo", pdf]).decode().split("Pages:")[1].split()[0])
text = [subprocess.check_output(["pdftotext", "-f", str(p), "-l", str(p), "-layout", pdf, "-"]).decode() for p in range(1, n + 1)]
lines = [[l.strip() for l in t.splitlines()] for t in text]

first = heads[0]["text"]
body_start = next(p for p in range(n) if first in lines[p])
found = {}
for h in heads:
    for p in range(body_start, n):
        if h["text"] in lines[p]:
            found[h["text"]] = p - body_start + 1
            break
    else:
        raise SystemExit(f"heading not found in PDF: {h['text']}")
json.dump(found, open(out, "w"), indent=1)
print(f"pages={n}, front matter={body_start}, headings located={len(found)}")
