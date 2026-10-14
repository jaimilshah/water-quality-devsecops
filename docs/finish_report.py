"""Insert a real TOC field (with cached entries/page numbers) into the generated report.

usage: finish_report.py in.docx out.docx headings.json [pages.json]
"""
import json
import re
import sys
import zipfile
from xml.sax.saxutils import escape

src, dst, heads_path = sys.argv[1:4]
pages = json.load(open(sys.argv[4])) if len(sys.argv) > 4 else {}
heads = json.load(open(heads_path))

RPR = '<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="22"/></w:rPr>'


def entry(h, first):
    ind = 0 if h["level"] == 1 else 360
    bold = "<w:b/>" if h["level"] == 1 else ""
    rpr = RPR.replace("<w:sz", bold + "<w:sz")
    begin = ""
    if first:
        begin = ('<w:r><w:fldChar w:fldCharType="begin"/></w:r>'
                 '<w:r><w:instrText xml:space="preserve"> TOC \\o "1-2" \\h \\z \\u </w:instrText></w:r>'
                 '<w:r><w:fldChar w:fldCharType="separate"/></w:r>')
    pg = str(pages.get(h["text"], "0"))
    return (f'<w:p><w:pPr><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="8630"/></w:tabs>'
            f'<w:spacing w:before="{80 if h["level"] == 1 else 0}" w:after="20"/><w:ind w:left="{ind}"/></w:pPr>{begin}'
            f'<w:r>{rpr}<w:t xml:space="preserve">{escape(h["text"])}</w:t></w:r>'
            f'<w:r>{rpr}<w:tab/></w:r><w:r>{rpr}<w:t>{pg}</w:t></w:r></w:p>')


toc_xml = "".join(entry(h, i == 0) for i, h in enumerate(heads))
toc_xml += '<w:p><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>'

zin = zipfile.ZipFile(src)
doc = zin.read("word/document.xml").decode("utf8")
i = doc.index("@@TOC@@")
start = max(doc.rfind("<w:p>", 0, i), doc.rfind("<w:p ", 0, i))
end = doc.index("</w:p>", i) + len("</w:p>")
doc = doc[:start] + toc_xml + doc[end:]

with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)
        if item.filename == "word/document.xml":
            data = doc.encode("utf8")
        zout.writestr(item, data)
print("TOC inserted:", len(heads), "entries;", "page numbers:", "filled" if pages else "placeholder")
