// Builds the "Setup and Commands Reference" sheet (docx). Run with NODE_PATH containing "docx".
const fs = require("fs");
const path = require("path");
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, VerticalAlign, LevelFormat, Footer, PageNumber } = require("docx");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "deliverables/Setup_and_Commands_Reference.docx");
const FONT = "Calibri";

const run = (t, o = {}) => new TextRun({ text: t, font: FONT, size: o.size || 21, bold: o.bold, italics: o.italics, color: o.color });
const P = (t, o = {}) => new Paragraph({ spacing: { after: o.after ?? 100 }, alignment: o.align, keepNext: o.keepNext, children: [run(t, o)] });
const H1 = (t) => new Paragraph({ spacing: { before: 280, after: 120 }, keepNext: true, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "B7202E", space: 2 } }, children: [run(t, { bold: true, size: 28, color: "B7202E" })] });
const H2 = (t) => new Paragraph({ spacing: { before: 160, after: 60 }, keepNext: true, children: [run(t, { bold: true, size: 23 })] });
const say = (t) => new Paragraph({ spacing: { before: 40, after: 120 }, shading: { type: ShadingType.CLEAR, fill: "FDF3F4" }, indent: { left: 120, right: 120 }, children: [run("Say: ", { bold: true, color: "B7202E", size: 20 }), run(t, { italics: true, size: 20 })] });
const bullet = (t) => new Paragraph({ numbering: { reference: "b", level: 0 }, spacing: { after: 50 }, children: [run(t)] });
function code(lines) {
  const b = { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC", space: 5 };
  return new Paragraph({ shading: { type: ShadingType.CLEAR, fill: "F2F2F2" }, spacing: { before: 40, after: 140 }, indent: { left: 130, right: 130 }, border: { top: b, bottom: b, left: b, right: b },
    children: lines.flatMap((l, i) => [new TextRun({ text: l, font: "Courier New", size: 17, break: i === 0 ? 0 : 1 })]) });
}
const line = { style: BorderStyle.SINGLE, size: 4, color: "999999" };
const borders = { top: line, bottom: line, left: line, right: line, insideHorizontal: line, insideVertical: line };
function cell(t, w, o = {}) {
  return new TableCell({ width: { size: w, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill } : undefined,
    margins: { top: 50, bottom: 50, left: 80, right: 80 }, children: [new Paragraph({ children: [run(t, { size: 19, bold: o.bold })] })] });
}
const table = (w, head, rows) => new Table({ width: { size: w.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: w, borders, rows: [
  new TableRow({ tableHeader: true, children: head.map((t, i) => cell(t, w[i], { fill: "F3D9DC", bold: true })) }),
  ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((t, i) => cell(t, w[i])) })),
] });

const c = [];
const add = (...x) => c.push(...x.flat());

add(
  new Paragraph({ spacing: { after: 40 }, children: [run("Setup and Commands Reference", { bold: true, size: 40, color: "B7202E" })] }),
  P("Secure DevSecOps Delivery of a Water Quality Monitoring and Alert System", { bold: true, size: 24 }),
  P("Every command we used to build, secure and deploy the project, in order. Passwords, tokens and access keys are never written here: they are typed at hidden prompts.", { italics: true, after: 160 }),
  table([2300, 6700], ["Tool", "What it is for (plain English)"], [
    ["Python + Flask", "Builds the website and checks the water readings"],
    ["Git + GitHub", "Saves every version of the code online"],
    ["Docker", "Packs the website into a sealed box that runs the same anywhere"],
    ["Jenkins", "The robot that runs all the steps automatically"],
    ["SonarQube", "Checks our own code for bugs and security flaws"],
    ["Trivy", "Checks the Docker box and files for known weaknesses"],
    ["Terraform + AWS", "Builds the cloud server from a written recipe"],
    ["JIRA", "The task board that shows progress"],
  ]),
  P("", { after: 40 }),
  P("Project folder: /Users/James/Downloads/WaterQualityDevSecOps   |   GitHub: github.com/jaimilshah/water-quality-devsecops", { size: 19 }),
  code(["app/            the website (Flask), templates and static files", "tests/          31 automatic tests", "Dockerfile      how the box is built", "Jenkinsfile     the pipeline steps", "ci/             Jenkins + SonarQube (Dockerfile + docker run)", "terraform/      the AWS server recipe", "reports/ docs/ evidence/ diagrams/   scan results, report, screenshots"]));

add(H1("1. Build the website and test it"),
  P("What we did: wrote a Flask web app with a dashboard, a CSV upload and a simulate button, using the same SAFE / WARNING / UNSAFE rules as phase one."),
  code(["python3 -m venv .venv                                  # private Python workspace", ".venv/bin/pip install -r requirements-dev.txt            # install Flask, pytest, etc.", ".venv/bin/python -m pytest --cov=app                     # 31 tests, 99% coverage", "cd app && ../.venv/bin/python app.py                       # run it at http://127.0.0.1:5000"]),
  P("Pages: / (dashboard), /health (is it alive), /api/simulate (demo data), /api/process (CSV upload)."),
  say("The website checks each reading against safe limits. 31 automatic tests prove the rules work, including the edge cases like pH exactly 6.5."));

add(H1("2. Git and GitHub (version control)"),
  code(["git init -b main                         # start the repository", "git add -A                                # choose all changed files", "git commit -m \"feat: ...\"                  # save a snapshot with a message", "git tag v1.0.0-baseline                    # label the first image version", "gh repo create water-quality-devsecops --public --source=. --remote=origin --push", "git push origin --tags                     # upload the labels too", "git log --oneline                          # see the history (13+ commits)"]),
  P("Commit message prefixes: feat = new feature, fix = bug fix, ci = pipeline change, docs = documentation. Before the first push we ran a secret scan (trivy fs --scanners secret .) to be sure no password was in the files."),
  say("GitHub keeps every change with a message, so anyone can see what was done and why."));

add(H1("3. Docker (the sealed box)"),
  P("The Dockerfile starts from a small base system, installs the website, removes tools it doesn't need, and runs as a normal user."),
  code(["FROM python:3.12-alpine                       # small base system", "RUN apk upgrade --no-cache                    # patch operating-system packages", "RUN pip install -r requirements.txt && pip uninstall -y pip   # install, then remove pip", "USER appuser                                  # not administrator", "HEALTHCHECK ...                               # Docker can see if it is healthy", "CMD gunicorn --preload --workers 2 app:app    # start the web server"]),
  code(["docker build -t water-quality-monitor:1.3.0 .             # make the image (the box)", "docker run -d --name wq -p 8080:8000 --read-only --tmpfs /tmp \\", "   --cap-drop ALL --security-opt no-new-privileges water-quality-monitor:1.3.0", "curl localhost:8080/health                                    # expect {\"status\":\"ok\"}", "docker ps                                                     # is it running and healthy?", "docker exec wq id                                             # proves it runs as non-root", "docker images water-quality-monitor                           # compare sizes", "docker rm -f wq                                               # stop and remove"]),
  table([2900, 6100], ["Run flag", "Meaning"], [
    ["--read-only", "files inside the box cannot be changed while it runs"],
    ["--tmpfs /tmp", "a temporary scratch folder kept in memory"],
    ["--cap-drop ALL", "removes all special administrator powers"],
    ["--security-opt no-new-privileges", "a process can never gain extra rights"],
    ["-p 8080:8000", "your computer's port 8080 goes to the box's port 8000"],
  ]),
  P("", { after: 40 }),
  table([1800, 3600, 1500, 2100], ["Image", "Base", "Size", "Security findings"], [["1.0.0", "python:3.12-slim (Debian)", "213 MB", "169 (44 HIGH)"], ["1.1.0", "python:3.12-alpine", "115 MB", "7"], ["final", "alpine, patched, pip removed", "102 MB", "0"]]),
  say("I made the box smaller and safer: a tiny base, a normal user, files locked. That took it from 169 known weaknesses to zero."));

add(H1("4. Trivy (security scanner)"),
  code(["trivy image water-quality-monitor:1.0.0            # scan the Docker box (the baseline)", "trivy image --severity HIGH,CRITICAL water-quality-monitor:1.3.0", "trivy fs --scanners vuln,secret,misconfig .         # libraries, passwords in files, config mistakes", "trivy config terraform/                             # Terraform and Dockerfile best practices", "trivy image --format json -o report.json <image>    # save a report"]),
  P("Findings: the first image had 169 (0 critical, 44 high), all coming from the Debian base system, not from our own libraries. Switching to Alpine and removing pip fixed them. The Terraform scan flagged one rule (open outbound traffic), which we narrowed to port 443 only and documented as an accepted risk."),
  say("Trivy compares everything installed in the box against a list of known weaknesses and tells me which ones are dangerous."));

add(H1("5. Jenkins and SonarQube (the automatic factory)"),
  H2("5.1 Start the tools"),
  code(["cd ci", "docker network create wq-ci-net            # shared network", "", "# SonarQube (official LTS Community image)", "docker run -d --name sonarqube --network wq-ci-net -p 9000:9000 \\", "  -e SONAR_SEARCH_JAVAADDITIONALOPTS=\"-Dnode.store.allow_mmap=false\" -e SONAR_VALIDATEWEBHOOKS=false \\", "  -v sonarqube_data:/opt/sonarqube/data sonarqube:lts-community", "", "# Jenkins (our own image from ci/Dockerfile)", "docker build -t jenkins-docker:lts .", "docker run -d --name jenkins --user root --network wq-ci-net -p 8090:8080 \\", "  -e JENKINS_HOME=$HOME/jenkins_home -v $HOME/jenkins_home:$HOME/jenkins_home \\", "  -v /var/run/docker.sock:/var/run/docker.sock jenkins-docker:lts", "", "docker ps                      # both running", "docker start sonarqube jenkins # after a computer restart"]),
  P("Jenkins is then configured in the browser: add three credentials (sonar-token, aws-access-key-id, aws-secret-access-key), add the SonarQube server (name sonarqube, URL http://sonarqube:9000), and create a Pipeline job from SCM pointing at the GitHub repo and the file Jenkinsfile. Full steps are in ci/README.md."),
  H2("5.2 SonarQube first-time setup (in the browser)"),
  bullet("Open http://localhost:9000, log in as admin / admin, and set a new password when asked."),
  bullet("Top-right profile, My Account, Security, Generate Token: choose Global Analysis Token. Copy it (shown once) and add it in Jenkins as the credential sonar-token."),
  bullet("Administration, Configuration, Webhooks, Create: name jenkins, URL http://jenkins:8080/sonarqube-webhook/ . This lets Jenkins hear the quality-gate result."),
  bullet("In this local lab SonarQube blocks webhooks to private addresses, so the setting SONAR_VALIDATEWEBHOOKS=false was added to its container (lab only)."),
  H2("5.3 The pipeline (Jenkinsfile)"),
  table([500, 3000, 5500], ["#", "Stage", "What it does"], [
    ["1", "Checkout", "Downloads the code from GitHub (BRANCH parameter, default main)"],
    ["2", "Unit Tests", "Runs pytest with coverage in a container"],
    ["3", "SonarQube Scan", "Sends the code to SonarQube to be checked"],
    ["4", "Quality Gate", "Stops the build if SonarQube says the code is not good enough"],
    ["5", "Build Docker Image", "Builds the box, tagged with the build number"],
    ["6", "Trivy Scan", "Makes an HTML + JSON report; fails on any HIGH or CRITICAL finding"],
    ["7", "Push to AWS ECR", "Logs in to AWS public ECR and pushes the image (build number + latest)"],
    ["8", "Deploy", "Runs the image and checks /health"],
  ]),
  P("", { after: 40 }),
  P("Run a build: open http://localhost:8090, log in, open the job water-quality-monitor, click Build with Parameters (BRANCH = main), then watch the Stage View. Console Output shows every command. The Trivy HTML report is under Build Artifacts."),
  H2("5.4 What SonarQube found, and what we changed"),
  table([2900, 2900, 3200], ["Finding", "Why it matters", "Fix"], [
    ["No CSRF protection on upload (CRITICAL)", "Another website could trick a visitor's browser into sending data to ours", "Flask-WTF token on every POST; returns 400 without it"],
    ["2 un-awaited promises (bugs)", "Errors could be silently lost", "Handled explicitly"],
    ["A test that compared a value to itself (bug)", "It could never fail, so it proved nothing", "Real assertion added"],
    ["A slow text-matching pattern (smell)", "Could be abused to slow the page", "Replaced by a simple parser"],
  ]),
  P("", { after: 40 }),
  P("Result after the fixes: Security A, Reliability A, Maintainability A, 0 open issues, 98.6% coverage."),
  say("SonarQube read my own code and found a real security flaw that no other scanner could see. I fixed it, ran the pipeline again, and it came back clean."));

add(H1("6. Terraform and AWS (the cloud server)"),
  H2("6.1 One-time setup"),
  code(["brew tap hashicorp/tap && brew install hashicorp/tap/terraform", "aws configure          # type the access key, secret, region ap-south-1, format json", "aws sts get-caller-identity       # proves the login works (shows account, no secrets)", "", "# SSH key pair used to log in to the server (saved on your computer)", "aws ec2 create-key-pair --key-name wq-key --region ap-south-1 --query KeyMaterial --output text > ~/.ssh/wq-key.pem", "chmod 400 ~/.ssh/wq-key.pem"]),
  H2("6.2 The recipe (terraform/ folder)"),
  table([2600, 6400], ["File", "What it holds"], [
    ["versions.tf", "Which cloud provider (AWS) and which region"],
    ["variables.tf", "Settings: key_name (required), region, server size, which ECR image to run"],
    ["main.tf", "The 7 resources: VPC, public subnet, internet gateway, route table + association, security group (ports 22 and 80), Ubuntu 24.04 EC2 server"],
    ["outputs.tf", "Prints the server's public IP and website address"],
  ]),
  P("", { after: 40 }),
  P("What the server does on first boot (the user_data in main.tf): installs Docker, then runs the image from AWS ECR with: docker run -d --name wq --restart always -p 80:8000 public.ecr.aws/v0x5n8i4/water-quality-monitor:latest"),
  H2("6.3 Create, check and remove"),
  code(["cd terraform", "terraform init                                  # download the AWS plugin (once)", "terraform validate                              # is the recipe correct?", "terraform plan -var=\"key_name=wq-key\"           # preview: should say 7 to add", "terraform apply -var=\"key_name=wq-key\"          # create it; type yes", "terraform output                                # public IP and website address", "curl http://<public-ip>/health                  # wait ~3 min after apply", "ssh -i ~/.ssh/wq-key.pem ubuntu@<public-ip>     # log in to the server", "docker ps                                       # (on the server) the container from ECR is running", "", "# when finished - removes everything so nothing is charged:", "terraform destroy -var=\"key_name=wq-key\""]),
  say("Terraform builds a network and an Ubuntu server on AWS from code. The server pulls the image that Jenkins pushed to ECR and runs it. The same image, from build to cloud."));

add(H1("7. JIRA (project tracking)"),
  P("Board: jaimilshah24.atlassian.net, project KAN. Tasks DSO-1 to DSO-9 (website, tests, GitHub, Docker, Jenkins, Terraform/AWS, SonarQube, Trivy and report, report/PPT/video) were created and moved from To Do through In Progress to Done."));

add(H1("8. Problems we hit and how they were fixed"),
  table([3200, 2900, 2900], ["Problem", "Cause", "Fix"], [
    ["Jenkins build 1 failed at the quality gate", "Scanner saved its working files outside the shared folder", "Set sonar.working.directory inside the workspace"],
    ["Build 2 failed at Trivy", "Docker options were placed after the image name", "Reordered the command"],
    ["Build 3 failed at Trivy", "Vulnerability database download dropped", "Shared a cache volume between scans"],
    ["SonarQube webhook rejected", "It blocks private addresses by default", "Disabled that check in the local lab"],
    ["Docker stopped working", "Mac disk was 99% full, so Docker's disk went read-only", "Freed space, restarted Docker"],
    ["AWS login failed", "Old access key was invalid", "New key created; the exposed one revoked"],
  ]));

add(H1("9. Quick reference for the demo"),
  code(["# website running locally in Docker (made by Jenkins):  http://localhost:8081", "# Jenkins:    http://localhost:8090        SonarQube: http://localhost:9000", "# After a restart:  docker start sonarqube jenkins", "", "# Show the cloud step again (about 3 min, then destroy it):", "cd /Users/James/Downloads/WaterQualityDevSecOps/terraform", "terraform apply -var=\"key_name=wq-key\"   # then: terraform output"]),
  P("Numbers to remember: 169 to 0 (Docker weaknesses), 213 to 102 MB (box size), 31 tests, 99% coverage, 1 real security flaw found by SonarQube and fixed.", { bold: true }));

const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: 21 } } } },
  numbering: { config: [{ reference: "b", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ["Page ", PageNumber.CURRENT], font: FONT, size: 18, color: "777777" })] })] }) },
    children: c,
  }],
});
Packer.toBuffer(doc).then((b) => { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, b); console.log("wrote", OUT); });
