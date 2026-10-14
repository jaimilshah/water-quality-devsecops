#!/usr/bin/env bash
# Full report build: docx -> TOC pass 1 -> render -> find pages -> TOC pass 2 -> final docx
set -euo pipefail
cd "$(dirname "$0")/.."
SK="/Users/James/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/89985111-f45d-4e5b-a4e7-d57ba568d25b/571a8c6b-2676-4f73-a64a-c34d227f1f69/skills/docx"
T=/tmp/rep; mkdir -p $T deliverables
NODE_PATH=/Users/James/Downloads/WaterQualityMonitor_SEPM/node_modules node docs/build_report.js $T/raw.docx
python3 docs/finish_report.py $T/raw.docx $T/pass1.docx docs/toc_headings.json
python3 "$SK/scripts/office/soffice.py" --headless --convert-to pdf --outdir $T $T/pass1.docx >/dev/null 2>&1
python3 docs/find_pages.py $T/pass1.pdf docs/toc_headings.json $T/pages.json
python3 docs/finish_report.py $T/raw.docx deliverables/DevSecOps_Microproject_Report.docx docs/toc_headings.json $T/pages.json
python3 "$SK/scripts/office/soffice.py" --headless --convert-to pdf --outdir $T deliverables/DevSecOps_Microproject_Report.docx >/dev/null 2>&1
python3 docs/find_pages.py $T/DevSecOps_Microproject_Report.pdf docs/toc_headings.json $T/pages2.json
cmp <(python3 -c "import json;print(sorted(json.load(open('$T/pages.json')).items()))") <(python3 -c "import json;print(sorted(json.load(open('$T/pages2.json')).items()))") && echo "TOC page numbers verified"
