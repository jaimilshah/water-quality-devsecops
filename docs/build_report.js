// Builds the DevSecOps micro-project report (.docx). Run with NODE_PATH pointing at a node_modules containing "docx".
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType,
  BorderStyle, ImageRun, PageBreak, ShadingType, VerticalAlign, LevelFormat, Footer, PageNumber, NumberFormat,
} = require("docx");

const ROOT = path.resolve(__dirname, "..");
const DIMS = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/image_dims.json"), "utf8"));
const FONT = "Times New Roman";
const OUT = process.argv[2] || path.join(ROOT, "deliverables/DevSecOps_Microproject_Report.docx");

const TITLE = "Secure DevSecOps Delivery of a Water Quality Monitoring and Alert System";
const REPO = "https://github.com/jaimilshah/water-quality-devsecops";
const LIVE = "http://3.6.150.185";
const JIRA = "https://jaimilshah24.atlassian.net/jira/software/projects/KAN/boards/1";

// ------------------------------------------------------------------ helpers
const run = (text, o = {}) => new TextRun({ text, font: FONT, size: o.size || 24, bold: o.bold, italics: o.italics, color: o.color });
function P(text, o = {}) {
  return new Paragraph({ alignment: o.align || AlignmentType.JUSTIFIED, spacing: o.spacing || { after: 160 }, keepNext: o.keepNext,
    children: Array.isArray(text) ? text : [run(text, o)] });
}
const headings = []; // collected for the TOC
function H1(text) {
  headings.push({ level: 1, text });
  return new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 240 }, children: [run(text, { bold: true, size: 28, color: "000000" })] });
}
function H2(text) {
  headings.push({ level: 2, text });
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 120 }, keepNext: true,
    children: [run(text, { bold: true, size: 25, color: "000000" })] });
}
function H3(text) { return new Paragraph({ spacing: { before: 120, after: 80 }, keepNext: true, children: [run(text, { bold: true, italics: true })] }); }
const bullet = (t) => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [run(t)] });
const num = (t, ref) => new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80 }, children: [run(t)] });
function code(lines) {
  const b = { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC", space: 6 };
  return new Paragraph({ shading: { type: ShadingType.CLEAR, fill: "F2F2F2" }, spacing: { before: 60, after: 200 }, indent: { left: 140, right: 140 }, border: { top: b, bottom: b, left: b, right: b },
    children: lines.flatMap((l, i) => [new TextRun({ text: l, font: "Courier New", size: 17, break: i === 0 ? 0 : 1 })]) });
}
let figN = 0;
function fig(rel, caption, widthPx) {
  const key = rel.startsWith("/") ? rel : rel;
  const [w, h] = DIMS[key];
  const width = widthPx, height = Math.round((width * h) / w);
  const ext = rel.toLowerCase().endsWith(".png") ? "png" : "jpg";
  const file = rel.startsWith("/") ? rel : path.join(ROOT, rel);
  figN += 1;
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 60 },
      children: [new ImageRun({ data: fs.readFileSync(file), transformation: { width, height }, type: ext })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [run(`Figure ${figN}: ${caption}`, { italics: true, size: 20 })] }),
  ];
}
const border = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const borders = { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border };
function cell(text, w, o = {}) {
  return new TableCell({ width: { size: w, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
    shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill } : undefined, margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: [new Paragraph({ alignment: o.align || AlignmentType.LEFT, children: [run(text, { size: o.size || 20, bold: o.bold })] })] });
}
function table(widths, header, rows, o = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, borders, alignment: AlignmentType.CENTER, rows: [
    new TableRow({ tableHeader: true, children: header.map((t, i) => cell(t, widths[i], { fill: "D9E2F3", bold: true, size: o.size })) }),
    ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((t, i) => cell(t, widths[i], { size: o.size })) })),
  ] });
}
const gap = () => new Paragraph({ spacing: { after: 120 }, children: [] });
const git = (c) => execSync(c, { cwd: ROOT }).toString().trim();
const commits = git("git rev-list --count HEAD");

// ------------------------------------------------------------------ front matter
const certificate = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 360 }, children: [run("CERTIFICATE", { bold: true, size: 32 })] }),
  P(`This is to certify that the microproject report entitled “${TITLE}” submitted by [Your Full Name] (Student Name), Roll No. [Your Roll No.], in partial fulfillment of the requirements of the course Software Engineering & Project Management (CSCOR1PC302), is a record of original work carried out under my guidance.`),
  P("Date: __________________________________", { spacing: { before: 600, after: 600 } }),
  P("_______________________________", { align: AlignmentType.RIGHT, spacing: { after: 20 } }),
  P("(Guide/Faculty name & Signature)", { align: AlignmentType.RIGHT }),
];
const nameRow = (a, b) => new TableRow({ children: [cell(a, 3960, { size: 24 }), cell(b, 3960, { size: 24 })] });
const titlePage = [
  new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { before: 600, after: 300 }, children: [run("Microproject Report", { bold: true, size: 36 })] }),
  P(`Project Title: ${TITLE}`, { bold: true, align: AlignmentType.CENTER, spacing: { after: 160 } }),
  P("DevSecOps Edition — aligned with SDG 9 (Industry, Innovation and Infrastructure) and SDG 6 (Clean Water and Sanitation)", { italics: true, align: AlignmentType.CENTER, spacing: { after: 240 } }),
  P("Course: Software Engineering Practices (SEP)", { align: AlignmentType.CENTER, spacing: { after: 60 } }),
  P("Course Code: CSCOR1PC302", { align: AlignmentType.CENTER, spacing: { after: 400 } }),
  new Table({ width: { size: 7920, type: WidthType.DXA }, columnWidths: [3960, 3960], alignment: AlignmentType.CENTER, borders,
    rows: [nameRow("Student Name(s)", "Roll No(s)"), nameRow("1. [Your Full Name]", "[Your Roll No.]"), nameRow("2.", ""), nameRow("3.", ""), nameRow("4.", "")] }),
  P("", { spacing: { after: 300 } }),
  P("Guide/Faculty: [Guide Name]", { bold: true, align: AlignmentType.LEFT, spacing: { after: 100 } }),
  P("Institute: Shah & Anchor Kutchhi Engineering College, Chembur, Mumbai - 400088", { align: AlignmentType.LEFT }),
  P("Academic Year: [20XX - 20XX]", { align: AlignmentType.LEFT }),
];
const tocSection = [
  new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { before: 240, after: 240 }, children: [run("Table of Contents", { bold: true, size: 28 })] }),
  new Paragraph({ children: [run("@@TOC@@")] }),
];

// ------------------------------------------------------------------ body
const body = [];
const add = (...x) => body.push(...x.flat());

// 1 Introduction
add(H1("1. Introduction"),
  P("Water is only useful if it is safe, and safety has to be verified continuously. In the first part of this micro project (Software Engineering Practices) a Water Quality Monitoring and Alert System was designed with structured analysis and design techniques (Context Diagram, Data Flow Diagram and Structure Chart) and implemented as a Python pipeline that validates sensor readings (pH, turbidity, TDS, dissolved oxygen, temperature), classifies them as SAFE, WARNING or UNSAFE, and raises alerts."),
  P("This second part keeps the same topic and turns the prototype into a real website that is built, tested, scanned, containerised and deployed through a DevSecOps workflow. DevSecOps means that security is not a final inspection but a set of automated checks that run on every change (“shift-left”): static code analysis, dependency and container scanning, and infrastructure-as-code checks are all part of the delivery pipeline."),
  H2("1.1 Alignment with SDG 9 and SDG 6"),
  P("SDG 9 (Industry, Innovation and Infrastructure) asks for resilient, innovative and reliable infrastructure. This project demonstrates a secure, reproducible and automated digital system: the site is delivered as a hardened container image, deployed on infrastructure created from code, and protected by automated quality and security gates. The application itself supports SDG 6 (Clean Water and Sanitation), Target 6.3, by detecting water-quality problems quickly."),
  H2("1.2 What was built"),
  bullet("A Flask web application with a dashboard, a CSV upload API and a dataset simulator (Section 4.1)."),
  bullet("A Git/GitHub repository with the full history, tags, Dockerfile, Jenkinsfile and Terraform code (Section 4.3)."),
  bullet("A hardened Docker image, reduced from 169 known vulnerabilities to none (Sections 4.4 and 5)."),
  bullet("A Jenkins pipeline with SonarQube and Trivy security gates (Section 4.5)."),
  bullet("Terraform code that provisions a secured server on AWS (Section 4.6)."),
  bullet("A vulnerability report with before-and-after evidence (Section 5)."));

// 2 Problem definition and scope
add(H1("2. Problem Definition and Scope"),
  H2("2.1 Problem Definition"),
  P("A monitoring tool that tells people whether their water is safe is itself a critical piece of infrastructure: if it is wrong, down, or exploitable, the consequences are real. A prototype that only runs on its author’s laptop does not meet that bar. The problem addressed in this part is therefore: how can the water-quality application be delivered as a reliable, repeatable and secure web service, with security problems found and fixed automatically before release rather than after an incident?"),
  H2("2.2 Objectives"),
  num("Develop a functional website for the water-quality pipeline, usable with an uploaded or simulated dataset.", "obj"),
  num("Maintain the source code in Git and GitHub with a meaningful history.", "obj"),
  num("Containerise the website with Docker and keep the image minimal and non-root.", "obj"),
  num("Automate build, test, scan and deployment with a Jenkins pipeline.", "obj"),
  num("Provision the AWS infrastructure with Terraform instead of manual console work.", "obj"),
  num("Analyse the code with SonarQube and the dependencies, image and infrastructure code with Trivy, then report and fix the findings.", "obj"),
  num("Track the work in JIRA and document the design with architecture and workflow diagrams.", "obj"),
  H2("2.3 Scope"),
  P("In scope: the web application and its API, automated tests, the Docker image, the Jenkins pipeline (run on a local Jenkins and SonarQube stack), the Terraform configuration and a real deployment to one AWS EC2 instance, and the security assessment of all of these."),
  P("Out of scope: physical sensor hardware, a production-grade database or user authentication, multi-region or load-balanced deployment, a custom domain with HTTPS certificates, and a managed (cloud-hosted) Jenkins or SonarQube service. These are listed as future scope in Section 7.2."),
  P("Stakeholders: municipal bodies and plant operators who need quick contamination alerts, residents who consume the water, and regulators who need auditable records. The people who maintain the system are served by the automated pipeline and the documented security results."));

// 3 Design and methodology
add(H1("3. Design and Methodology"),
  H2("3.1 Application Architecture"),
  P("The application is a single Flask service served by Gunicorn inside a Docker container on an EC2 instance. The browser downloads one HTML page and static assets; all data processing happens on the server. A user uploads a CSV (or asks for a simulated dataset), and the server runs the same validate, classify and alert modules designed in the structured-design phase, returning JSON that the page renders as statistics, charts and an alert log."),
  fig("diagrams/architecture.png", "Application architecture: browser, security group, EC2 instance and the hardened container (drawn programmatically; equivalent to Draw.io output)", 560),
  H2("3.2 DevSecOps Workflow"),
  P("Every change follows the same path: the developer pushes to GitHub; Jenkins checks out the code and runs ten stages. Security is built in at four points — SonarQube (code), the quality gate (policy), Trivy on the repository (dependencies, secrets, infrastructure code) and Trivy on the built image. A build fails automatically on any HIGH or CRITICAL finding, so a vulnerable build can never reach the deploy stage."),
  fig("diagrams/cicd_workflow.png", "CI/CD and DevSecOps workflow: GitHub, Jenkins stages with security gates, Docker deploy and Terraform on AWS", 560),
  H2("3.3 Tools and Justification"),
  table([1500, 2700, 4430], ["Area", "Tool", "Why it was chosen"], [
    ["Website", "Python, Flask, Gunicorn, Chart.js", "Small, well-known stack; the pipeline logic from the first phase is reused unchanged; Chart.js is vendored locally so no third-party code is loaded at run time"],
    ["Version control", "Git and GitHub", "Required by the assignment; also the source the EC2 server clones at boot"],
    ["Container", "Docker (python:3.12-alpine)", "Reproducible runtime; Alpine removes most OS packages that carry vulnerabilities"],
    ["CI/CD", "Jenkins (declarative pipeline)", "Required; the Jenkinsfile keeps the pipeline in version control; runs every tool in a container so the Jenkins host needs only Docker"],
    ["Infrastructure", "Terraform, AWS EC2", "Repeatable, reviewable infrastructure; one command creates and one command removes everything"],
    ["Code analysis", "SonarQube Community", "Finds bugs, vulnerabilities and code smells and enforces a quality gate"],
    ["Dependency, image and IaC scan", "Trivy", "One tool for CVEs in libraries, OS packages, secrets and Terraform/Dockerfile misconfiguration"],
    ["Tracking", "JIRA Kanban board", "Backlog of DSO-1 to DSO-9 tasks moved through To Do, In Progress and Done"],
  ], { size: 19 }),
  gap(),
  H2("3.4 Security-by-Design Decisions"),
  bullet("Strict Content-Security-Policy and security headers (no inline scripts or styles; no external scripts)."),
  bullet("CSRF protection on the upload endpoint, 1 MB upload limit, file-type and encoding checks, row limit and strict numeric parsing."),
  bullet("The page builds all dynamic content with textContent (never innerHTML), removing a whole class of cross-site scripting bugs."),
  bullet("Container runs as a non-root user with a read-only root filesystem, no Linux capabilities, no-new-privileges, a health check and no package manager in the final image."),
  bullet("EC2 instance: IMDSv2 required, encrypted root volume, no SSH port (administration through AWS Systems Manager), security group allowing only port 80 in and port 443 out."),
  bullet("No secrets in the repository: the Jenkins admin password and SonarQube token are supplied at start-up through hidden prompts or environment variables."),
  H2("3.5 Project Management"),
  P(`Work was planned as nine backlog items on the JIRA board (${JIRA}): DSO-1 website, DSO-2 tests, DSO-3 GitHub, DSO-4 Docker, DSO-5 Jenkins pipeline, DSO-6 Terraform and AWS, DSO-7 SonarQube, DSO-8 Trivy and vulnerability report, DSO-9 diagrams, report, presentation and demo video. The board is shown in Section 10.`));

// 4 Implementation and results
add(H1("4. Implementation and Results"),
  H2("4.1 Website"),
  P("The site has three server routes plus static assets. The same classification rules as the structured-design phase apply: a reading with no parameter outside its safe range is SAFE, one out-of-range parameter is WARNING and two or more is UNSAFE."),
  table([2300, 1300, 5030], ["Route", "Method", "Purpose"], [
    ["/", "GET", "Dashboard page; issues the CSRF token"],
    ["/health", "GET", "Liveness check used by Docker and the pipeline"],
    ["/api/simulate?n=40&seed=42", "GET", "Generates a simulated session (with an injected contamination event) and processes it"],
    ["/api/process", "POST", "Accepts an uploaded .csv (CSRF token required), validates it and returns classified readings, alerts and summary"],
  ], { size: 19 }),
  gap(),
  ...fig("evidence/aws_website_live.png", "The website running on AWS after uploading the sample CSV: server-side pipeline log, summary cards, alert timeline, five sensor charts and the alert log", 330),
  H2("4.2 Testing"),
  P("31 automated pytest tests cover the pipeline modules (boundary values such as pH 6.5 and 8.5, single and multiple breaches, invalid sensor values, CSV parsing errors) and the web layer (health, headers, simulation parameters, upload validation, oversized and non-UTF-8 files, and CSRF with and without a token). Coverage is 99% of the Python code."),
  ...fig("evidence/term_pytest.png", "Unit tests and coverage (31 passed, 99%)", 520),
  P("The upload button was also tested in a real browser (headless Chrome driving the page, selecting the sample CSV, clicking Process Dataset) against both the Jenkins-deployed container and the AWS server: 40 samples were processed (20 SAFE, 10 WARNING, 10 UNSAFE) with no console errors."),
  H2("4.3 Version Control (GitHub)"),
  P(`The code is in a public repository: ${REPO}. It contains the website source, tests, Dockerfile, Jenkinsfile, Terraform configuration, CI stack, diagrams, scan reports and evidence. History has ${commits} commits with descriptive messages in conventional style (feat, fix, ci, docs) and two tags: v1.0.0-baseline (first image, before hardening) and v1.2.0 (hardened image).`),
  table([1100, 1500, 6030], ["Commit", "Date", "Message"], git("git log --reverse --format='%h|%ad|%s' --date=short").split("\n").map((l) => { const [h, d, ...m] = l.split("|"); return [h, d, m.join("|")]; }), { size: 17 }),
  gap(),
  H2("4.4 Docker"),
  P("The Dockerfile starts from python:3.12-alpine, patches OS packages, installs the pinned requirements, removes pip from the final layer, creates an unprivileged user and defines a health check. Gunicorn runs with --preload so that all workers share the CSRF signing key."),
  code(["FROM python:3.12-alpine", "RUN apk upgrade --no-cache", "COPY requirements.txt .", "RUN pip install --no-cache-dir --upgrade pip \\", " && pip install --no-cache-dir -r requirements.txt \\", " && pip uninstall -y pip", "COPY app/ ./app/", "RUN adduser -S -D -H -s /sbin/nologin appuser", "USER appuser", "HEALTHCHECK CMD python -c \"...urlopen('http://127.0.0.1:8000/health')\"", "CMD [\"sh\",\"-c\",\"exec gunicorn --preload --bind 0.0.0.0:${PORT} --workers 2 app:app\"]"]),
  table([1700, 3200, 1500, 2230], ["Image", "Base", "Size", "Trivy findings"], [
    ["1.0.0 baseline", "python:3.12-slim (Debian 13.7)", "213 MB", "169 (44 HIGH)"],
    ["1.1.0", "python:3.12-alpine, pip upgraded", "115 MB", "7 (4 HIGH)"],
    ["final (1.3.0)", "alpine, patched, pip removed", "102 MB", "0"],
  ], { size: 19 }),
  gap(),
  ...fig("evidence/term_docker.png", "Image built by Jenkins and deployed container (non-root, read-only filesystem, all capabilities dropped)", 540),
  H2("4.5 Jenkins CI/CD Pipeline"),
  P("Jenkins and SonarQube run from docker-compose (ci/). Jenkins is configured as code (JCasC): the admin user, the SonarQube server and token, and the pipeline job are created automatically from environment variables, so no secret is stored in the repository. Each tool (pytest, SonarScanner, Trivy, Terraform) runs in its own container, so the Jenkins host needs only Docker."),
  table([600, 2500, 5530], ["#", "Stage", "What it does"], [
    ["1", "Checkout", "Clones the repository from GitHub"],
    ["2", "Unit tests + coverage", "Runs pytest in a python:3.12 container, publishes JUnit results and coverage.xml"],
    ["3", "SonarQube analysis", "Runs SonarScanner against the SonarQube server"],
    ["4", "Quality gate", "Waits for the SonarQube webhook result; the build aborts if the gate fails"],
    ["5", "Trivy: dependencies, secrets, IaC", "Fails the build on any HIGH or CRITICAL finding"],
    ["6", "Docker build", "Builds the image tagged with the build number"],
    ["7", "Trivy: image scan", "Scans OS and Python packages in the image; fails on HIGH or CRITICAL"],
    ["8", "Terraform validate", "terraform fmt -check, init and validate in a container"],
    ["9", "Deploy (Docker)", "Runs the hardened container and checks /health over the Docker network"],
    ["10", "Terraform apply (AWS)", "Optional (parameter), requires manual approval and AWS credentials stored in Jenkins"],
  ], { size: 19 }),
  gap(),
  ...fig("evidence/jenkins_stage_view_left.jpg", "Jenkins stage view, first stages: builds #1 to #4 (red = failed while the pipeline was being built, green = success)", 560),
  ...fig("evidence/jenkins_stage_view_right.jpg", "Jenkins stage view, later stages: build #4 passes every stage; Terraform apply is intentionally skipped", 560),
  ...fig("evidence/jenkins_console_build6.jpg", "Console output of the final build #6: Pipeline succeeded", 460),
  P("The pipeline did not work first time. Three builds failed before the first success, which is normal when building a pipeline and is recorded here because each failure had a clear cause:"),
  table([700, 2800, 5130], ["Build", "Failed stage", "Cause and fix"], [
    ["#1", "Quality gate", "The scanner container wrote its working directory outside the shared workspace, so Jenkins could not find report-task.txt. Fixed by running the scanner with an explicit sonar.working.directory inside the workspace."],
    ["#2", "Trivy", "Docker options were placed after the image name, so Trivy received them as its own flags. Fixed by separating the docker run options from the image."],
    ["#3", "Trivy", "The vulnerability database download was dropped by a transient network failure. Fixed by sharing a cache volume (pre-seeded) between scans, configurable through a pipeline parameter."],
    ["#4", "none", "First fully green build, including the Docker deploy health check."],
    ["#5", "none", "After the SonarQube fixes (Section 5.2): quality gate and all scans pass."],
    ["#6", "none", "Final build: image 0 vulnerabilities, 31 tests passed."],
  ], { size: 19 }),
  gap(),
  H2("4.6 AWS Infrastructure with Terraform"),
  P("The Terraform configuration (terraform/) creates seven resources in the default VPC of ap-south-1: an EC2 t3.micro instance (Amazon Linux 2023), a security group with its ingress and egress rules, an IAM role with the AmazonSSMManagedInstanceCore policy, and an instance profile. The instance start-up script (user_data) installs Docker, clones the GitHub repository, builds the image and runs the container with the same hardened options used locally."),
  code(["resource \"aws_instance\" \"web\" {", "  ami           = data.aws_ssm_parameter.al2023.value", "  instance_type = var.instance_type", "  metadata_options { http_tokens = \"required\" }   # IMDSv2", "  root_block_device { encrypted = true  volume_type = \"gp3\" }", "  user_data = templatefile(\"user_data.sh.tftpl\", { repo_url = var.repo_url, ... })", "}"]),
  P("terraform plan reported 7 resources to add; terraform apply created them in about 15 seconds. The instance was later replaced once (plan: 1 to add, 1 to destroy) so that the live site runs the final, security-fixed code."),
  ...fig("evidence/term_terraform.png", "terraform validate, state list and outputs", 480),
  ...fig("evidence/term_aws.png", "AWS CLI confirmation: instance running, IMDSv2 required, volume encrypted, only port 80 in and 443 out, and the CSRF check on the live server", 480));

// 5 Security
add(H1("5. Security Assessment and Basic Vulnerability Report"),
  H2("5.1 Scan Scope"),
  table([3000, 1800, 3830], ["Target", "Tool", "Checks"], [
    ["Python source (app/, tests/) and JavaScript", "SonarQube", "Bugs, vulnerabilities, code smells, security hotspots, coverage, duplication"],
    ["requirements.txt (Flask, Flask-WTF, Gunicorn)", "Trivy fs", "Known CVEs in dependencies"],
    ["Repository files", "Trivy fs", "Hard-coded secrets"],
    ["Dockerfile, ci/Dockerfile.jenkins, Terraform", "Trivy config", "Misconfiguration against security best practice"],
    ["Docker image (every version)", "Trivy image", "CVEs in OS packages and Python packages"],
  ], { size: 19 }),
  gap(),
  H2("5.2 SonarQube Findings"),
  P("The first analysis passed the default quality gate, but the ratings showed real problems: Security D, Reliability C, coverage 53.7%. The analysis found one vulnerability, three bugs and one code smell in the first-party code:"),
  table([500, 1700, 1100, 2100, 3230], ["#", "Rule / location", "Severity", "Threat", "Fix applied"], [
    ["1", "python:S4502 app/app.py:10", "CRITICAL vulnerability", "No CSRF protection: a malicious page could make a visitor’s browser submit uploads", "Flask-WTF CSRFProtect; token in the page, sent as X-CSRFToken, 400 without it; shared signing key (Gunicorn --preload); 2 new tests"],
    ["2", "javascript:S9383 app.js:200", "MAJOR bug", "Un-awaited promise could become an unhandled rejection", "Explicit void; errors are handled inside callApi"],
    ["3", "javascript:S9383 app.js:204", "MAJOR bug", "Same as above", "Same"],
    ["4", "python:S5863 test_core.py:65", "MAJOR bug", "Test compared an expression with itself and could never fail", "Compare two separate runs and assert that a different seed differs"],
    ["5", "javascript:S8786 app.js:125", "MAJOR code smell", "Regular expression with super-linear backtracking (ReDoS risk)", "Replaced by an indexOf/slice parser"],
  ], { size: 17 }),
  gap(),
  ...fig("evidence/sonar_before.jpg", "SonarQube, first analysis: Security D (1 issue), Reliability C, coverage 53.7%", 460),
  P("After the fixes (builds #5 and #6) SonarQube reports 0 bugs, 0 vulnerabilities, 0 code smells and 0 security hotspots, Security A, Reliability A, Maintainability A, 98.6% coverage and 0.0% duplication, with the quality gate passed. JavaScript is excluded from the coverage figure because the project has no JavaScript unit tests; this is recorded as future scope."),
  ...fig("evidence/sonar_after.jpg", "SonarQube after remediation: all ratings A, 0 open issues, coverage 98.6%", 460),
  H2("5.3 Trivy Image and Dependency Findings"),
  P("The first image (python:3.12-slim) had 169 findings: 0 CRITICAL, 44 HIGH, 63 MEDIUM and 62 LOW. The 44 HIGH results are only eight distinct CVEs repeated across packages that ship the same library. None was fixed upstream at scan time, so upgrading was not an option; removing the packages by changing the base image was."),
  table([1900, 1500, 2100, 3130], ["CVE(s)", "Severity", "Component", "Threat and fix"], [
    ["CVE-2026-76642, -78408, -78409, -78410", "HIGH", "util-linux family (9 packages)", "Mount-helper privilege misuse, cgroup authority leak, bind-mount escape (local privilege escalation). No Debian fix: remove by switching to Alpine/busybox"],
    ["CVE-2026-54369", "HIGH", "libacl1", "Symlink traversal leading to privilege escalation. Alpine base"],
    ["CVE-2025-69720", "HIGH", "ncurses (4 packages)", "Buffer overflow, possible code execution. Alpine base"],
    ["CVE-2026-16742", "HIGH", "systemd (libsystemd0, libudev1)", "Local privilege escalation. Alpine base"],
    ["CVE-2026-9538", "HIGH", "perl-base", "Denial of service via crafted tar header. Alpine base"],
    ["6 CVEs (e.g. CVE-2025-8869, CVE-2026-6357)", "MEDIUM/LOW", "pip 25.0.1", "Path traversal and malicious-wheel handling when installing packages. Upgrade pip, then remove it from the runtime image"],
  ], { size: 17 }),
  gap(),
  ...fig("evidence/term_trivy_baseline.png", "Trivy scan of the baseline image 1.0.0 (excerpt): 163 OS findings, 44 of them HIGH, and 6 in pip", 540),
  P("Version 1.1.0 (Alpine) left seven findings, all with fixes available: zlib CVE-2026-85091 (MEDIUM) and, inside pip’s own vendored libraries, msgpack GHSA-6v7p-g79w-8964, setuptools CVE-2025-47273 and CVE-2026-59890, and urllib3 CVE-2026-97687, -97688 and -97689. The final image applies the OS patch and removes pip, which the running application does not need."),
  ...fig("evidence/term_trivy_summary.png", "Trivy results for the three image versions", 540),
  ...fig("evidence/term_trivy_final.png", "Trivy scan of the final image: 0 vulnerabilities in OS and Python packages", 540),
  ...fig("evidence/term_trivy_fs.png", "Trivy filesystem scan: 0 dependency vulnerabilities and no secrets; the only misconfiguration is a LOW finding in the CI image", 540),
  H2("5.4 Infrastructure-as-Code Findings"),
  table([1500, 1300, 5830], ["ID", "Severity", "Finding and decision"], [
    ["AWS-0104", "CRITICAL (rule rating)", "Security group egress to 0.0.0.0/0. Accepted risk: the server must reach GitHub and package mirrors on first boot. Restricted to TCP 443 only, no SSH, IMDSv2, encrypted volume, read-only container. Documented inline with #trivy:ignore. Future fix: VPC endpoints or an egress proxy."],
    ["DS-0026", "LOW", "No HEALTHCHECK in ci/Dockerfile.jenkins. Fixed in the source; the running lab container was built before the change."],
  ], { size: 18 }),
  gap(),
  P("The application Dockerfile passed all 27 checks and the Terraform configuration passed 70 checks, after the single documented exception above."),
  H2("5.5 Summary and Residual Risk"),
  table([3000, 1800, 1800, 2030], ["Area", "First scan", "Final", "Status"], [
    ["Docker image (Trivy)", "169 (44 HIGH)", "0", "Fixed"],
    ["Python dependencies (Trivy)", "0", "0", "Clean"],
    ["Secrets in repository", "0", "0", "Clean"],
    ["Code (SonarQube)", "1 vuln, 3 bugs, 1 smell", "0", "Fixed"],
    ["Terraform / Dockerfile", "1 critical rule, 1 LOW", "1 accepted, 1 fixed", "Documented"],
  ], { size: 19 }),
  gap(),
  P("Residual risk: new CVEs are published daily, so “0 findings” is true only for the scan date (2026-10-15). The pipeline repeats the scans on every build and fails on HIGH or CRITICAL results, which is how the risk stays managed. Other known limits: the site is served over HTTP only (no TLS certificate), there is no user authentication, and there is no rate limiting beyond the upload size limit."));

// 6 Analysis
add(H1("6. Analysis and Interpretation"),
  H2("6.1 Testing Results"),
  P("All 31 tests pass and cover 99% of the Python code. The most valuable tests were the boundary cases: a reading of exactly pH 8.5 or 6.5 must be SAFE, and a breach count of two must be UNSAFE, because an off-by-one in these rules would silently misreport water quality. The CSRF tests proved the fix works rather than assuming it: the same upload request returns 400 without a token and 200 with one. The seeded simulation produces exactly 20 SAFE, 10 WARNING and 10 UNSAFE in Python, in the browser and on AWS, which confirms the deployed system behaves like the tested one."),
  H2("6.2 Pipeline Performance"),
  table([3600, 1700, 3330], ["Stage (build #4)", "Duration", "Comment"], [
    ["Checkout", "1 s", "Shallow clone from GitHub"],
    ["Unit tests + coverage", "5 s", "31 tests"],
    ["SonarQube analysis", "39 s", "Largest stage (up to 1 min 34 s on first run while the scanner image was pulled)"],
    ["Quality gate", "< 1 s", "Result delivered by webhook"],
    ["Trivy: dependencies, secrets, IaC", "2 s", "Database cached in a shared volume"],
    ["Docker build", "13 s", "Layers cached after the first build"],
    ["Trivy: image scan", "2 s", ""],
    ["Terraform validate", "22 s", "Downloads the AWS provider in a container"],
    ["Deploy (Docker + health check)", "4 s", ""],
    ["Total", "about 1.5 min", "Average over the five runs shown: 1 min 46 s"],
  ], { size: 19 }),
  gap(),
  P("A complete build, test, security-gate and deploy cycle takes about a minute and a half, which is fast enough to run on every commit. The slowest part is static analysis, which is also the part that found the most important application bug. Caching decisions mattered most: before the Trivy database was cached, each build downloaded about 130 MB several times and one build failed on a dropped connection."),
  H2("6.3 Security Findings"),
  P("Two different kinds of scanner found two different kinds of problem, and neither could replace the other. Trivy found that almost all the risk in the first image came from the operating-system layer of the base image (165 of 169 findings) and not from the application’s own libraries, which were clean. The most effective fix was therefore not a patch but a smaller base image: choosing Alpine removed every HIGH finding at once and halved the image size. SonarQube, on the other hand, found a genuine application weakness that no dependency scanner can see: missing CSRF protection on the upload endpoint. It also found a test that could never fail, which is a quality problem that quietly weakens every other check. The lesson is that container scanning, dependency scanning and static analysis are complementary."),
  P("The infrastructure scan showed the value of conscious risk acceptance: the one critical rule (open egress) was not blindly suppressed or blindly obeyed; it was narrowed to port 443, justified in the code and documented here."),
  H2("6.4 Challenges and Lessons"),
  bullet("Pipeline integration problems (Section 4.5, builds #1 to #3) came from details of running tools in containers: shared workspace paths, argument order and network reliability. Each was found from the console log within minutes, which is a benefit of having the pipeline as code."),
  bullet("Local resources matter: the laptop disk filled to 99%, making Docker’s virtual disk read-only and stopping all builds. Cleaning caches, pruning 5 GB of Docker build cache and restarting Docker fixed it. A CI environment needs disk monitoring."),
  bullet("SonarQube refuses webhooks to private Docker addresses by default; for the local lab this check was disabled with a documented setting, which would not be done in production."),
  bullet("Credentials need care: an access key pasted into a chat by mistake had to be revoked and replaced. The project now keeps secrets out of files and prompts for them with hidden input."),
  bullet("Cost: the AWS deployment used one free-tier-class t3.micro instance for a few hours (roughly one rupee per hour) and is destroyed with terraform destroy after the demonstration."));

// 7 Conclusion
add(H1("7. Conclusion and Future Scope"),
  H2("7.1 Conclusion"),
  P("The water-quality prototype from the first phase is now a working, secure web service delivered by an automated pipeline. The website runs on AWS from a Docker image that was reduced from 169 known vulnerabilities to none; the code passes SonarQube with straight A ratings after a real CSRF vulnerability and four other issues were found and fixed; the infrastructure is created from reviewed Terraform code; and every step from commit to deployment is automated, repeatable and documented. The project shows how an innovative, reliable and secure digital system (SDG 9) can be built even at student scale, and the system itself contributes to monitoring water quality (SDG 6)."),
  H2("7.2 Future Scope"),
  num("Serve the site over HTTPS (Application Load Balancer or CloudFront with an ACM certificate) and add a custom domain.", "future"),
  num("Add user authentication and a persistent database so datasets and alerts are stored per organisation.", "future"),
  num("Connect real IoT sensors (ESP32 or Arduino) and send SMS or e-mail alerts.", "future"),
  num("Push images to a registry (Amazon ECR) signed with cosign, and deploy with blue-green rollout on ECS or Kubernetes.", "future"),
  num("Add JavaScript unit tests, dynamic application security testing (OWASP ZAP) and software bill of materials (SBOM) generation to the pipeline.", "future"),
  num("Store Terraform state remotely (S3 with locking) and run terraform plan automatically on pull requests.", "future"),
  num("Add monitoring and alerting for the platform itself (CloudWatch alarms, log shipping).", "future"));

// 8 References
const refs = [
  "United Nations, “Sustainable Development Goal 9: Build resilient infrastructure, promote inclusive and sustainable industrialization and foster innovation,” sdgs.un.org.",
  "United Nations, “Sustainable Development Goal 6: Ensure availability and sustainable management of water and sanitation for all,” sdgs.un.org.",
  "World Health Organization, “Guidelines for Drinking-water Quality,” 4th ed., WHO, Geneva, 2017.",
  "Bureau of Indian Standards, “IS 10500:2012 Drinking Water - Specification,” BIS, New Delhi, 2012.",
  "OWASP Foundation, “Cross-Site Request Forgery Prevention Cheat Sheet,” OWASP Cheat Sheet Series.",
  "OWASP Foundation, “OWASP Top Ten Web Application Security Risks.”",
  "National Institute of Standards and Technology, “Application Container Security Guide,” NIST SP 800-190, 2017.",
  "Docker Inc., “Best practices for writing Dockerfiles,” Docker documentation.",
  "Aqua Security, “Trivy documentation: vulnerability, secret and misconfiguration scanning.”",
  "SonarSource, “SonarQube documentation: quality gates, analysis parameters and Jenkins integration.”",
  "Jenkins project, “Pipeline Syntax and Jenkins Configuration as Code,” Jenkins documentation.",
  "HashiCorp, “Terraform documentation and AWS Provider reference,” developer.hashicorp.com.",
  "Amazon Web Services, “Amazon EC2 instance metadata (IMDSv2) and AWS Systems Manager Session Manager,” AWS documentation.",
  "Pallets Projects, “Flask documentation” and “Flask-WTF: CSRF protection.”",
  "G. Kim, J. Humble, P. Debois and J. Willis, “The DevOps Handbook,” IT Revolution Press, 2016.",
];
add(H1("8. References"), ...refs.map((r) => num(r, "refs")));

// 9 Reflection
const reflection = [
  "In the first part of this micro project I designed a water-quality monitor on paper and wrote it in Python. This second part taught me that a working program is only the beginning: the real work is delivering it safely and repeatably. The skill I valued most was seeing security as a routine part of the pipeline instead of a last-minute review.",
  "I completed it by building one layer at a time and testing each before moving on. I turned the pipeline code into a Flask website, wrote automated tests, packaged it with Docker, and then wrote a Jenkinsfile that runs everything on every commit. I used GitHub for history, Terraform for the AWS server, JIRA for the task board, and SonarQube and Trivy to scan the code, the dependencies, the image and the infrastructure files.",
  "The scan results were the most educational part. Trivy reported 169 vulnerabilities in my first image, and I expected to spend hours upgrading libraries. Instead I learned that almost all of them came from the base image, and that choosing a smaller Alpine image removed every high-severity finding at once. SonarQube then found something I had not noticed at all: my upload form had no CSRF protection, so another website could have made a visitor’s browser submit data to it. Fixing it meant changing the page, the server and the tests together, and re-running the pipeline proved the fix. It also found a test that compared a value with itself and could never fail, which was a humbling reminder that tests need checking too.",
  "Several things went wrong, and those taught me the most. Three early builds failed because of small details such as the order of Docker arguments and a dropped download. My laptop disk filled up and Docker stopped working. I accidentally pasted a secret key into a chat and had to revoke it immediately. Each problem showed me why secrets must be handled carefully and why a pipeline defined as code is easier to debug than manual steps.",
  "These skills are directly useful for my career. Employers expect developers to understand containers, continuous integration and basic cloud security, and I now have a real project that demonstrates all of them end to end. For higher studies or research, the habit of measuring before and after, as I did with the vulnerability counts, makes results trustworthy. I also gained communication practice by documenting decisions, including the one risk I chose to accept and why.",
];
const wc = reflection.join(" ").split(/\s+/).length;
if (wc < 400 || wc > 500) throw new Error(`Reflection is ${wc} words, must be 400-500`);
add(H1("9. Project Reflection"),
  P(`Reflection (${wc} words)`, { bold: true, align: AlignmentType.LEFT }),
  ...reflection.map((t) => P(t)),
  P("[To be submitted through the institute’s AI/Turnitin similarity check as instructed.]", { italics: true, size: 20 }));

// 10 Evidence
const jiraFig = [
  ...fig("evidence/jira_list_tasks.jpg", "JIRA list view: backlog items DSO-1 to DSO-9 (KAN-10 to KAN-18) added after the structured-design tasks; completed items are struck through", 470),
  ...fig("evidence/jira_list_status.jpg", "JIRA list view, Status column: DSO-1 to DSO-8 Done, DSO-9 (report, presentation, demo video) In Progress", 470),
];
add(H1("10. Evidence of Completion"),
  H2("10.1 Links"),
  table([2600, 6030], ["Item", "Link / location"], [
    ["GitHub repository", REPO],
    ["Demonstration video (LinkedIn)", "[LinkedIn video URL - to be added after upload]"],
    ["Presentation", "DevSecOps_Microproject_Presentation.pptx (submitted with this report)"],
    ["Live website (AWS EC2)", `${LIVE}  (running during the demonstration; removed afterwards with terraform destroy)`],
    ["JIRA board", JIRA],
    ["Vulnerability report", `${REPO}/blob/main/docs/vulnerability_report.md`],
    ["Scan screenshots", "Figures 6 to 8 (Jenkins), 9 and 10 (Terraform, AWS), 11 to 16 (SonarQube, Trivy) and 17 to 18 (JIRA); originals in the evidence/ folder of the repository"],
  ], { size: 19 }),
  gap(),
  H2("10.2 Project Tracking"),
  ...jiraFig,
  H2("10.3 How to Reproduce"),
  code([
    "git clone " + REPO, "cd water-quality-devsecops",
    "python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt && .venv/bin/python -m pytest",
    "docker build -t water-quality-monitor:1.3.0 .",
    "docker run -d -p 8080:8000 --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges water-quality-monitor:1.3.0",
    "trivy image water-quality-monitor:1.3.0",
    "cd ci && ./start.sh            # Jenkins :8090 + SonarQube :9000",
    "cd terraform && terraform init && terraform plan && terraform apply   # then: terraform destroy",
  ]),
  P("Note: passwords, access keys and tokens are not shown in any screenshot or file in this report; the AWS account number is masked in the terminal captures."));

// ------------------------------------------------------------------ document
const footer = () => new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20 })] })] });
const page = (fmt) => ({ size: { width: 12240, height: 15840 }, margin: { top: 1440, bottom: 1440, left: 1800, right: 1800 }, pageNumbers: { start: 1, formatType: fmt } });
const list = (ref) => ({ reference: ref, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] });
const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: 24 } } } },
  numbering: { config: [
    { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    list("obj"), list("future"), list("refs"),
  ] },
  sections: [
    { properties: { page: page(NumberFormat.LOWER_ROMAN) }, footers: { default: footer() }, children: [...certificate, ...titlePage, ...tocSection] },
    { properties: { page: page(NumberFormat.DECIMAL) }, footers: { default: footer() }, children: body },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buf);
  fs.writeFileSync(path.join(ROOT, "docs/toc_headings.json"), JSON.stringify(headings, null, 1));
  console.log(`wrote ${OUT} | figures=${figN} | reflection words=${wc} | headings=${headings.length}`);
});
