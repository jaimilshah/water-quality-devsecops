// DevSecOps micro-project presentation on the college template (4:3).
// Run: NODE_PATH=<node_modules with pptxgenjs> node docs/build_ppt.js
const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ASSETS = "/Users/James/Downloads/WaterQualityMonitor_SEPM/template_assets";
const DIMS = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/image_dims.json"), "utf8"));
const OUT = path.join(ROOT, "deliverables/DevSecOps_Microproject_Presentation.pptx");

const MAROON = "B7202E", PURPLE = "5A0886", INK = "1A1A1A", MUTED = "4D4D4D", CARD = "F7EEEF", GREY = "F2F2F2";
const SAFE = "2E7D32", WARN = "F9A825", BAD = "E53935";
const F_HEAD = "Bodoni MT", F_BODY = "Verdana";

const pres = new pptxgen();
pres.layout = "LAYOUT_4x3"; // 10 x 7.5 in, same as the template
const W = 10, H = 7.5;
const SIDEBAR = { x: 0, y: 0, w: 0.465, h: 7.5 };
const LOGO_STD = { x: 0.531, y: 6.349, w: 0.826, h: 1.170 };
const LOGO_TITLE = { x: 0.781, y: 6.015, w: 0.826, h: 1.170 };
const CX = 0.78, CW = W - CX - 0.4;

const tpl = (n) => path.join(ASSETS, n);
const ev = (n) => path.join(ROOT, n);
const aspect = (rel) => { const [w, h] = DIMS[rel]; return h / w; };

function base(s, { logo = LOGO_STD } = {}) {
  s.background = { color: "FFFFFF" };
  s.addImage({ path: tpl("watermark_logo.png"), x: 0, y: 0, w: W, h: H, transparency: 96 });
  s.addImage({ path: tpl("sidebar_maroon.png"), ...SIDEBAR });
  s.addImage({ path: tpl("shield_logo.png"), ...logo });
}
let slideNo = 0;
function newSlide(kicker, title) {
  const s = pres.addSlide();
  slideNo += 1;
  base(s);
  s.addText(kicker.toUpperCase(), { x: CX, y: 0.34, w: CW, h: 0.28, fontFace: F_BODY, fontSize: 11, bold: true, color: MAROON, charSpacing: 1.5, isTextBox: true });
  s.addText(title, { x: CX, y: 0.6, w: CW, h: 0.62, fontFace: F_HEAD, fontSize: 24, bold: true, color: INK, isTextBox: true });
  s.addText(String(slideNo), { x: W - 0.7, y: H - 0.42, w: 0.4, h: 0.3, fontFace: F_BODY, fontSize: 10, color: MUTED, align: "right", isTextBox: true });
  return s;
}
const card = (s, x, y, w, h, fill = CARD) => s.addShape("roundRect", { x, y, w, h, rectRadius: 0.1, fill: { color: fill }, line: { type: "none" } });
function bullets(s, items, x, y, w, rowH, size = 10.5, color = INK) {
  items.forEach((t, i) => {
    s.addText("•", { x, y: y + i * rowH, w: 0.2, h: rowH, fontFace: F_HEAD, fontSize: size + 3, bold: true, color: MAROON, isTextBox: true, valign: "top", margin: 0 });
    s.addText(t, { x: x + 0.22, y: y + i * rowH, w: w - 0.22, h: rowH, fontFace: F_BODY, fontSize: size, color, isTextBox: true, valign: "top", margin: 0, lineSpacingMultiple: 1.1 });
  });
}
function stat(s, x, y, w, h, value, label, color = INK) {
  card(s, x, y, w, h);
  s.addText(value, { x, y: y + 0.08, w, h: h * 0.55, align: "center", valign: "bottom", fontFace: F_HEAD, fontSize: 22, bold: true, color, isTextBox: true, margin: 0 });
  s.addText(label, { x, y: y + h * 0.62, w, h: h * 0.36, align: "center", valign: "top", fontFace: F_BODY, fontSize: 8.5, color: MUTED, isTextBox: true, margin: 0 });
}
function img(s, rel, x, y, w) {
  const h = w * aspect(rel);
  s.addImage({ path: ev(rel), x, y, w, h });
  return h;
}
function caption(s, text, x, y, w, align = "center") {
  s.addText(text, { x, y, w, h: 0.4, fontFace: F_BODY, fontSize: 8.5, italic: true, color: MUTED, align, isTextBox: true, valign: "top", margin: 0 });
}

// ============================================================ 1 Title
{
  const s = pres.addSlide(); slideNo += 1;
  base(s, { logo: LOGO_TITLE });
  s.addText([
    { text: "Mahavir Education Trust's\n", options: { fontSize: 15, fontFace: F_HEAD } },
    { text: "Shah & Anchor Kutchhi Engineering College\n", options: { fontSize: 24, bold: true, fontFace: F_HEAD } },
    { text: "Chembur, Mumbai-400088\n", options: { fontSize: 15, fontFace: F_HEAD } },
    { text: "An Autonomous Institute Affiliated to University of Mumbai", options: { fontSize: 15, fontFace: F_HEAD } },
  ], { x: 1.0, y: 0.25, w: 8.3, h: 1.75, align: "center", valign: "middle", color: INK, isTextBox: true, lineSpacingMultiple: 1.08 });
  const pw = 5.0, ph = pw * (3195075 / 7000901);
  s.addImage({ path: tpl("college_photo.jpeg"), x: (W - pw) / 2, y: 2.05, w: pw, h: ph });
  s.addText("Secure DevSecOps Delivery of a Water Quality\nMonitoring and Alert System", { x: 1.0, y: 2.05 + ph + 0.12, w: 8.3, h: 0.95, align: "center", valign: "top", fontFace: F_HEAD, fontSize: 19, bold: true, color: MAROON, isTextBox: true, lineSpacingMultiple: 1.05 });
  s.addText("CIAP Micro Project — Software Engineering Practices  ·  SDG 9 & SDG 6", { x: 1.0, y: 2.05 + ph + 1.0, w: 8.3, h: 0.3, align: "center", fontFace: F_BODY, fontSize: 10.5, italic: true, color: MUTED, isTextBox: true });
  s.addText([{ text: "[Your Full Name]\n", options: { bold: true, italic: true } }, { text: "Roll No. [Your Roll No.]", options: { bold: true, italic: true } }],
    { x: 4.4, y: 5.95, w: 2.4, h: 0.6, align: "center", fontFace: F_BODY, fontSize: 12, color: INK, isTextBox: true });
}

// ============================================================ 2 Vision & Mission (verbatim from template)
{
  const s = pres.addSlide(); slideNo += 1;
  base(s);
  s.addText("Vision & Mission", { x: 2.7, y: 0.35, w: 4.17, h: 0.67, align: "center", fontFace: F_HEAD, fontSize: 28, bold: true, color: INK, isTextBox: true });
  const pill = (x, y, t) => {
    s.addShape("roundRect", { x, y, w: 2.78, h: 0.47, rectRadius: 0.235, fill: { color: PURPLE }, line: { color: "F2F2F2", width: 1.5 } });
    s.addText(t, { x, y, w: 2.78, h: 0.47, align: "center", valign: "middle", fontFace: F_BODY, fontSize: 11, bold: true, color: "FFFFFF", isTextBox: true, margin: 0 });
  };
  const para = (x, y, h, t) => s.addText(t, { x, y, w: 3.21, h, fontFace: F_BODY, fontSize: 11, color: INK, isTextBox: true, align: "justify", lineSpacingMultiple: 1.15 });
  pill(1.31, 1.46, "Institute Vision");
  para(1.38, 2.23, 1.0, "To become a globally recognized institution offering quality education and enhancing professional standards");
  pill(5.4, 1.46, "Department Vision");
  para(5.47, 2.23, 1.3, "To be a globally recognized department that provides quality education, promotes ethical practices, and prepares professionals to tackle real world challenges.");
  pill(1.31, 4.0, "Institute Mission");
  para(1.38, 4.75, 1.8, "To impart high quality technical education to the students by providing an excellent academic environment, well-equipped laboratories and training through motivated teachers.");
  pill(5.4, 4.0, "Department Mission");
  para(5.47, 4.75, 1.8, "1. To deliver high-quality value-based education and enhance the teaching-learning process for professional excellence.\n\n2. To promote research, industry collaboration and entrepreneurship to address global challenges.");
}

// ============================================================ 3 Problem definition and scope
{
  const s = newSlide("Problem Definition and Scope", "A monitoring tool must itself be dependable and secure");
  s.addText("The first phase produced a working water-quality pipeline, but a prototype on one laptop is not infrastructure. If a tool that reports water safety is down, unpatched or exploitable, the consequences are real.", { x: CX, y: 1.35, w: CW, h: 0.95, fontFace: F_BODY, fontSize: 11.5, color: INK, isTextBox: true, lineSpacingMultiple: 1.2 });
  s.addText("Objectives", { x: CX, y: 2.4, w: 4, h: 0.3, fontFace: F_HEAD, fontSize: 13, bold: true, color: MAROON, isTextBox: true });
  const objs = ["Build a functional website (upload or simulate a dataset)", "Git + GitHub version control", "Docker image, minimal and non-root", "Jenkins CI/CD with automated security gates", "AWS infrastructure from Terraform", "SonarQube + Trivy scans with a vulnerability report", "JIRA tracking and architecture diagrams"];
  objs.forEach((t, i) => {
    const y = 2.8 + i * 0.5;
    s.addShape("ellipse", { x: CX, y, w: 0.26, h: 0.26, fill: { color: MAROON }, line: { type: "none" } });
    s.addText(String(i + 1), { x: CX, y, w: 0.26, h: 0.26, align: "center", valign: "middle", fontFace: F_BODY, fontSize: 9.5, bold: true, color: "FFFFFF", isTextBox: true, margin: 0 });
    s.addText(t, { x: CX + 0.38, y: y - 0.03, w: 4.6, h: 0.34, fontFace: F_BODY, fontSize: 10, color: INK, valign: "middle", isTextBox: true, margin: 0 });
  });
  card(s, 5.95, 2.4, 3.25, 3.75, MAROON);
  s.addText("SCOPE", { x: 6.2, y: 2.58, w: 2.8, h: 0.28, fontFace: F_BODY, fontSize: 10, bold: true, color: "FFD9DC", charSpacing: 1.2, isTextBox: true });
  s.addText("In: website, tests, Docker image, Jenkins + SonarQube + Trivy pipeline, Terraform and a real AWS deployment, security report.", { x: 6.2, y: 2.95, w: 2.8, h: 1.45, fontFace: F_BODY, fontSize: 9.5, color: "FFFFFF", isTextBox: true, lineSpacingMultiple: 1.15, valign: "top" });
  s.addText("Out: sensor hardware, user accounts and database, HTTPS/custom domain, multi-region deployment.", { x: 6.2, y: 4.45, w: 2.8, h: 1.0, fontFace: F_BODY, fontSize: 9.5, color: "FFE3E5", isTextBox: true, lineSpacingMultiple: 1.15, valign: "top" });
  s.addText("SDG 9: innovative, reliable and secure infrastructure", { x: 6.2, y: 5.5, w: 2.8, h: 0.55, fontFace: F_BODY, fontSize: 9, italic: true, color: "FFFFFF", isTextBox: true, valign: "top" });
}

// ============================================================ 4 Architecture
{
  const s = newSlide("System Design", "Application architecture");
  const w = 8.4; const h = img(s, "diagrams/architecture.png", CX + 0.2, 1.4, w);
  caption(s, "Browser → security group (port 80 only) → EC2 → non-root, read-only Docker container running Gunicorn + Flask. Admin through SSM, no SSH.", 1.7, 1.4 + h + 0.1, 7.7, "left");
}

// ============================================================ 5 DevSecOps workflow
{
  const s = newSlide("System Design and DevSecOps Workflow", "Ten pipeline stages, four security gates");
  const w = 8.4; const h = img(s, "diagrams/cicd_workflow.png", CX + 0.2, 1.4, w);
  caption(s, "Security gates: SonarQube analysis, quality gate, Trivy (dependencies, secrets, IaC) and Trivy image scan. Any HIGH or CRITICAL finding fails the build, so a vulnerable build never reaches deploy.", 1.7, 1.4 + h + 0.1, 7.7, "left");
}

// ============================================================ 6 Website
{
  const s = newSlide("Website Implementation", "A Flask web app that processes datasets on the server");
  const w = 3.1; const h = img(s, "evidence/aws_website_live.png", CX, 1.35, w);
  caption(s, "Live on AWS after a CSV upload", CX, 1.35 + Math.min(h, 4.7) + 0.05, w);
  s.addText("Routes", { x: 4.2, y: 1.35, w: 3, h: 0.3, fontFace: F_HEAD, fontSize: 13, bold: true, color: MAROON, isTextBox: true });
  bullets(s, ["GET /  dashboard, issues the CSRF token", "GET /health  liveness check", "GET /api/simulate  seeded demo session", "POST /api/process  CSV upload, CSRF required"], 4.2, 1.7, 5.0, 0.45, 9.5);
  s.addText("Built-in security", { x: 4.2, y: 3.6, w: 3, h: 0.3, fontFace: F_HEAD, fontSize: 13, bold: true, color: MAROON, isTextBox: true });
  bullets(s, ["Strict Content-Security-Policy, no inline scripts", "CSRF token, 1 MB limit, type and encoding checks", "DOM built with textContent (no XSS sinks)", "Vendored Chart.js, no third-party code at runtime"], 4.2, 3.95, 5.0, 0.45, 9.5);
  card(s, 4.2, 5.85, 5.0, 0.6);
  s.addText("Same rules as phase 1: 0 breaches SAFE, 1 WARNING, 2+ UNSAFE.", { x: 4.35, y: 5.85, w: 4.7, h: 0.6, fontFace: F_BODY, fontSize: 9, italic: true, color: MAROON, isTextBox: true, valign: "middle" });
}

// ============================================================ 7 Testing
{
  const s = newSlide("Website Implementation and Testing", "31 tests, 99% coverage, real-browser check");
  const w = 5.0; const h = img(s, "evidence/term_pytest.png", CX, 1.4, w);
  [["31", "tests passed"], ["99%", "coverage"], ["0", "browser console errors"]].forEach(([v, l], i) => stat(s, 6.0 + (i % 2) * 1.6, 1.4 + Math.floor(i / 2) * 1.0, 1.5, 0.9, v, l, MAROON));
  s.addText("What the tests prove", { x: CX, y: 1.4 + h + 0.2, w: 5, h: 0.3, fontFace: F_HEAD, fontSize: 13, bold: true, color: MAROON, isTextBox: true });
  bullets(s, ["Boundary values (pH 6.5 / 8.5) classify as SAFE; 2 breaches = UNSAFE", "Bad CSV, wrong file type, non-UTF-8 and oversized files are rejected", "Upload without a CSRF token returns 400; with a token returns 200", "Headless Chrome uploads the sample CSV on Docker and on AWS: 40 samples, 20 SAFE / 10 WARNING / 10 UNSAFE"], CX, 1.4 + h + 0.55, 8.4, 0.5, 10);
}

// ============================================================ 8 Docker
{
  const s = newSlide("Docker Deployment", "213 MB / 169 CVEs down to 102 MB / 0");
  [["213 → 102 MB", "image size"], ["169 → 0", "Trivy findings"], ["non-root", "read-only FS, caps dropped"]].forEach(([v, l], i) => stat(s, CX + i * 2.9, 1.4, 2.7, 0.95, v, l, MAROON));
  const w = 7.4; const h = img(s, "evidence/term_docker.png", CX + 0.5, 2.5, w);
  bullets(s, ["python:3.12-alpine, apk upgrade, requirements pinned, pip removed from the final layer", "docker run --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges"], CX, 2.5 + h + 0.12, 8.4, 0.34, 9.3);
}

// ============================================================ 9 Jenkins
{
  const s = newSlide("Jenkins Pipeline", "Jenkinsfile: checkout, test, scan, build, deploy");
  const stages = ["Checkout", "Unit tests + coverage", "SonarQube analysis", "Quality gate", "Trivy: deps, secrets, IaC", "Docker build", "Trivy: image scan", "Terraform validate", "Deploy + health check", "Terraform apply (approval)"];
  stages.forEach((t, i) => {
    const y = 1.4 + i * 0.4;
    s.addShape("ellipse", { x: CX, y: y + 0.03, w: 0.27, h: 0.27, fill: { color: [2, 3, 4, 6].includes(i) ? PURPLE : MAROON }, line: { type: "none" } });
    s.addText(String(i + 1), { x: CX, y: y + 0.03, w: 0.27, h: 0.27, align: "center", valign: "middle", fontFace: F_BODY, fontSize: 8.5, bold: true, color: "FFFFFF", isTextBox: true, margin: 0 });
    s.addText(t, { x: CX + 0.38, y, w: 2.8, h: 0.33, fontFace: F_BODY, fontSize: 10, color: INK, valign: "middle", isTextBox: true, margin: 0 });
  });
  s.addText("purple = security gate", { x: CX, y: 5.45, w: 3, h: 0.25, fontFace: F_BODY, fontSize: 8.5, italic: true, color: PURPLE, isTextBox: true, margin: 0 });
  const w = 5.2; const h = img(s, "evidence/jenkins_stage_view_right.jpg", 4.15, 1.4, w);
  caption(s, "Build #4: every stage green (Terraform apply skipped by design)", 4.15, 1.4 + h + 0.05, w);
  card(s, 4.15, 1.4 + h + 0.55, w, 1.45);
  s.addText("Builds #1 to #3 failed first: scanner working directory, Docker argument order, a dropped DB download. Each was fixed from the console log. #4 to #6 are green. Total run ≈ 1.5 min.", { x: 4.3, y: 1.4 + h + 0.6, w: w - 0.3, h: 1.35, fontFace: F_BODY, fontSize: 9.5, color: INK, isTextBox: true, valign: "middle", lineSpacingMultiple: 1.15 });
}

// ============================================================ 10 Terraform / AWS
{
  const s = newSlide("AWS Infrastructure Using Terraform", "Seven resources, created and verified from code");
  bullets(s, ["EC2 t3.micro (Amazon Linux 2023), IMDSv2 required, encrypted gp3 volume", "Security group: port 80 in, port 443 out, no SSH", "IAM role + SSM Session Manager for administration", "user_data installs Docker, clones GitHub, builds and runs the hardened container", "plan: 7 to add; apply: ~15 s; destroy when finished"], CX, 1.35, 8.4, 0.38, 9.8);
  const w1 = 3.55, w2 = 4.4;
  const h1 = img(s, "evidence/term_terraform.png", CX, 3.4, w1);
  const h2 = img(s, "evidence/term_aws.png", CX + w1 + 0.25, 3.4, w2);
  caption(s, "terraform validate, state, outputs", CX, 3.4 + h1 + 0.05, w1);
  caption(s, "AWS CLI: running, IMDSv2, encrypted, ports", CX + w1 + 0.25, 3.4 + Math.min(h2, 3.1) + 0.05, w2);
}

// ============================================================ 11 SonarQube
{
  const s = newSlide("Security Scan Results", "SonarQube found a real vulnerability; the fix is verified");
  const w = 3.75;
  const h1 = img(s, "evidence/sonar_before.jpg", CX, 1.35, w);
  img(s, "evidence/sonar_after.jpg", CX + w + 0.3, 1.35, w);
  caption(s, "Before: Security D, Reliability C, coverage 53.7%", CX, 1.35 + h1 + 0.04, w);
  caption(s, "After: A / A / A, 0 issues, coverage 98.6%", CX + w + 0.3, 1.35 + h1 + 0.04, w);
  s.addText("What it found and how it was fixed", { x: CX, y: 1.35 + h1 + 0.42, w: 6, h: 0.3, fontFace: F_HEAD, fontSize: 12.5, bold: true, color: MAROON, isTextBox: true });
  bullets(s, ["CRITICAL: no CSRF protection on upload \u2192 Flask-WTF token, 400 without it", "2 bugs: un-awaited promises \u2192 explicit handling", "1 bug: test compared a value with itself \u2192 real assertion", "Code smell: regex with ReDoS risk \u2192 simple parser"], CX, 1.35 + h1 + 0.78, 8.4, 0.3, 9.3);
}

// ============================================================ 12 Trivy chart
{
  const s = newSlide("Security Scan Results", "Trivy: 169 findings to zero by changing the base image");
  const data = [
    { name: "HIGH", labels: ["1.0.0 baseline", "1.1.0", "Final"], values: [44, 4, 0] },
    { name: "MEDIUM", labels: ["1.0.0 baseline", "1.1.0", "Final"], values: [63, 3, 0] },
    { name: "LOW", labels: ["1.0.0 baseline", "1.1.0", "Final"], values: [62, 0, 0] },
  ];
  s.addChart(pres.charts.BAR, data, {
    x: CX, y: 1.35, w: 5.2, h: 3.3, barDir: "col", barGrouping: "clustered", chartColors: [BAD, WARN, "9E9E9E"],
    showTitle: true, title: "Vulnerabilities per image version", titleFontFace: F_BODY, titleFontSize: 11, titleColor: INK,
    showLegend: true, legendPos: "b", legendFontFace: F_BODY, legendFontSize: 9,
    showValue: true, dataLabelFontFace: F_BODY, dataLabelFontSize: 9, dataLabelPosition: "outEnd",
    catAxisLabelFontFace: F_BODY, catAxisLabelFontSize: 9, valAxisLabelFontFace: F_BODY, valAxisLabelFontSize: 9,
    valGridLine: { color: "E0E0E0", size: 0.5 }, catGridLine: { style: "none" },
  });
  stat(s, 6.3, 1.4, 1.45, 1.0, "169", "baseline findings", BAD);
  stat(s, 7.85, 1.4, 1.35, 1.0, "0", "final findings", SAFE);
  bullets(s, ["44 HIGH = only 8 distinct CVEs repeated across Debian packages (util-linux, ncurses, systemd, acl, perl)", "No upstream fix existed, so the fix was removing them: Alpine base", "pip's own CVEs: upgrade, then remove pip from runtime", "Flask, Flask-WTF, Gunicorn: 0 CVEs, 0 secrets"], 6.3, 2.65, 2.9, 0.62, 8.3);
  const h = img(s, "evidence/term_trivy_summary.png", CX, 4.85, 5.2);
  caption(s, "Trivy output for the three image versions", CX, 4.85 + h + 0.05, 5.2);
}

// ============================================================ 13 Vulnerability report table
{
  const s = newSlide("Basic Vulnerability Report", "Findings, severity, threat and fix");
  const hdr = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: MAROON }, fontFace: F_BODY, fontSize: 8.5, valign: "middle" } });
  const c = (t, o = {}) => ({ text: t, options: { fontFace: F_BODY, fontSize: 8, color: INK, valign: "middle", ...o } });
  const rows = [
    [hdr("Finding"), hdr("Severity"), hdr("Possible threat"), hdr("Fix / status")],
    [c("python:S4502  no CSRF protection (SonarQube)"), c("CRITICAL", { color: BAD, bold: true }), c("Another site makes a visitor's browser submit uploads"), c("Flask-WTF token + tests. Fixed")],
    [c("util-linux x4 CVEs, ncurses, systemd, acl, perl (Trivy)"), c("HIGH x44", { color: BAD, bold: true }), c("Local privilege escalation, code execution, DoS inside the container"), c("Alpine base removes them. Fixed")],
    [c("pip 25.0.1: 6 CVEs (Trivy)"), c("MEDIUM / LOW"), c("Malicious wheel or index installs files"), c("Upgrade, then remove pip. Fixed")],
    [c("javascript:S9383 x2, python:S5863 (SonarQube bugs)"), c("MAJOR"), c("Unhandled rejection; a test that can never fail"), c("Code and test fixes. Fixed")],
    [c("javascript:S8786 regex backtracking"), c("MAJOR smell"), c("ReDoS slow-down"), c("Replaced by indexOf parser. Fixed")],
    [c("AWS-0104 egress 0.0.0.0/0 (Trivy IaC)"), c("CRITICAL rule", { color: BAD, bold: true }), c("Host could exfiltrate over HTTPS"), c("Limited to TCP 443; accepted and documented")],
    [c("DS-0026 no HEALTHCHECK, Jenkins image"), c("LOW"), c("Unhealthy CI container not detected"), c("Added in source. Fixed")],
  ];
  s.addTable(rows, { x: CX, y: 1.4, w: 8.8, colW: [2.9, 1.15, 2.6, 2.15], border: { type: "solid", pt: 0.5, color: "BDBDBD" }, rowH: 0.52, margin: [0.04, 0.06, 0.04, 0.06], autoPage: false });
  card(s, CX, 5.7, 8.8, 0.55);
  s.addText("Final state: Trivy 0 findings (OS + Python + dependencies), 0 secrets, SonarQube 0 issues. Scope and details are in the report, Section 5.", { x: CX + 0.15, y: 5.7, w: 8.5, h: 0.55, fontFace: F_BODY, fontSize: 9, italic: true, color: MAROON, isTextBox: true, valign: "middle" });
}

// ============================================================ 14 Analysis
{
  const s = newSlide("Analysis", "Fast pipeline; scanners found different problems");
  s.addChart(pres.charts.BAR, [{ name: "seconds", labels: ["Checkout", "Unit tests", "SonarQube", "Quality gate", "Trivy fs", "Docker build", "Trivy image", "Terraform", "Deploy"], values: [1, 5, 39, 1, 2, 13, 2, 22, 4] }], {
    x: CX, y: 1.35, w: 4.6, h: 4.3, barDir: "bar", chartColors: [MAROON], showTitle: true, title: "Stage duration, build #4 (seconds)", titleFontFace: F_BODY, titleFontSize: 10.5, titleColor: INK,
    showLegend: false, showValue: true, dataLabelFontFace: F_BODY, dataLabelFontSize: 8.5, dataLabelPosition: "outEnd",
    catAxisLabelFontFace: F_BODY, catAxisLabelFontSize: 8.5, valAxisLabelFontFace: F_BODY, valAxisLabelFontSize: 8.5, catAxisOrientation: "maxMin",
    valGridLine: { color: "E0E0E0", size: 0.5 }, catGridLine: { style: "none" },
  });
  bullets(s, ["Full cycle ≈ 1.5 min: fast enough for every commit", "Most risk lived in the base image (165 of 169 findings), not in the app's libraries", "Only static analysis could find the CSRF flaw; only Trivy could find the OS CVEs", "Challenges: Docker disk went read-only at 99% full, webhook validation, flaky DB download, leaked key rotated"], 5.6, 1.4, 3.6, 1.05, 9.2);
  s.addText("Shared cache volume cut repeated 130 MB DB downloads; SonarQube analysis is the slowest stage (39 s).", { x: 5.6, y: 5.8, w: 3.6, h: 0.5, fontFace: F_BODY, fontSize: 8.5, italic: true, color: MUTED, isTextBox: true });
}

// ============================================================ 15 Reflection
{
  const s = newSlide("Reflection", "What this project taught me");
  const items = [
    ["Security is a pipeline stage", "Automated gates catch problems on every commit instead of after release."],
    ["Smaller is safer", "Choosing a minimal base image removed every HIGH finding at once."],
    ["Scanners complement each other", "Trivy found OS CVEs; SonarQube found a real CSRF flaw and a test that could never fail."],
    ["Failures are data", "Six builds, three failures; each fixed from logs because the pipeline is code."],
  ];
  items.forEach(([t, d], i) => {
    const x = CX + (i % 2) * 4.4, y = 1.45 + Math.floor(i / 2) * 2.1;
    card(s, x, y, 4.15, 1.85);
    s.addText(t, { x: x + 0.22, y: y + 0.15, w: 3.7, h: 0.4, fontFace: F_HEAD, fontSize: 12.5, bold: true, color: MAROON, isTextBox: true });
    s.addText(d, { x: x + 0.22, y: y + 0.6, w: 3.7, h: 1.1, fontFace: F_BODY, fontSize: 9.5, color: INK, isTextBox: true, valign: "top", lineSpacingMultiple: 1.2 });
  });
}

// ============================================================ 16 Conclusion and future scope
{
  const s = newSlide("Conclusion and Future Scope", "A secure, automated path from commit to cloud");
  s.addText("The water-quality prototype is now a working service delivered by an automated pipeline: tested (31 tests), analysed (SonarQube A/A/A), scanned (Trivy 0 findings), containerised, and deployed on AWS from Terraform code, with every step repeatable and documented. It supports SDG 9 (secure, reliable infrastructure) and SDG 6 (water-quality monitoring).", { x: CX, y: 1.4, w: 4.9, h: 3.4, fontFace: F_BODY, fontSize: 10.5, color: INK, isTextBox: true, lineSpacingMultiple: 1.3, valign: "top" });
  card(s, 5.9, 1.4, 3.3, 4.7, MAROON);
  s.addText("FUTURE SCOPE", { x: 6.15, y: 1.6, w: 2.8, h: 0.3, fontFace: F_BODY, fontSize: 10, bold: true, color: "FFD9DC", charSpacing: 1.2, isTextBox: true });
  ["HTTPS via load balancer + ACM certificate", "Authentication and a persistent database", "Real IoT sensors, SMS / e-mail alerts", "Signed images in ECR, blue-green rollout", "JS tests, OWASP ZAP (DAST), SBOM", "Remote Terraform state, plan on pull requests"].forEach((t, i) => {
    s.addText("→", { x: 6.15, y: 2.05 + i * 0.66, w: 0.3, h: 0.5, fontFace: F_HEAD, fontSize: 12, bold: true, color: "FFFFFF", isTextBox: true, margin: 0 });
    s.addText(t, { x: 6.5, y: 2.05 + i * 0.66, w: 2.6, h: 0.6, fontFace: F_BODY, fontSize: 9.3, color: "FFFFFF", isTextBox: true, valign: "top", margin: 0, lineSpacingMultiple: 1.1 });
  });
}

// ============================================================ 17 Thank you
{
  const s = pres.addSlide(); slideNo += 1;
  base(s, { logo: LOGO_TITLE });
  s.addText("THANK YOU !", { x: 0.78, y: 0.4, w: 7, h: 0.8, fontFace: F_BODY, fontSize: 36, color: INK, isTextBox: true });
  s.addText("Questions welcome — live demo available on request", { x: 0.78, y: 1.3, w: 8, h: 0.5, fontFace: F_BODY, fontSize: 14, italic: true, color: MAROON, isTextBox: true });
  s.addText([
    { text: "GitHub:  ", options: { bold: true } }, { text: "github.com/jaimilshah/water-quality-devsecops\n" },
    { text: "Live site:  ", options: { bold: true } }, { text: "http://3.6.150.185  (during the demo)\n" },
    { text: "JIRA:  ", options: { bold: true } }, { text: "jaimilshah24.atlassian.net  (board KAN)\n" },
    { text: "Demo video:  ", options: { bold: true } }, { text: "[LinkedIn link]" },
  ], { x: 0.78, y: 2.4, w: 8.4, h: 1.6, fontFace: F_BODY, fontSize: 12, color: INK, isTextBox: true, lineSpacingMultiple: 1.5, valign: "top" });
}

pres.writeFile({ fileName: OUT }).then(() => console.log("wrote", OUT, "slides:", slideNo));
