# Water Quality Monitoring & Alert System - DevSecOps edition

SEP (CSCOR1PC302) CIAP micro project. Aligned with **SDG 6** (Clean Water and Sanitation) and **SDG 9** (Industry, Innovation and Infrastructure).

A Flask web application that validates, classifies and raises alerts on water-quality sensor readings
(pH, turbidity, TDS, dissolved oxygen, temperature), delivered through a secure DevSecOps pipeline.

| Concern | Tool | Where |
|---|---|---|
| Website | Python / Flask / Gunicorn, Chart.js | `app/` |
| Tests | pytest + coverage (99%, 31 tests incl. CSRF) | `tests/` |
| Version control | Git + GitHub | this repo |
| Containerisation | Docker (Alpine, non-root, no pip in runtime) | `Dockerfile` |
| CI/CD | Jenkins declarative pipeline | `Jenkinsfile`, `ci/` |
| Infrastructure | Terraform on AWS (EC2 + SG + IAM/SSM) | `terraform/` |
| Code quality / SAST | SonarQube | `sonar-project.properties` |
| Dependency, image, IaC scanning | Trivy | `reports/` |
| Diagrams | architecture + CI/CD workflow | `diagrams/` |

## Run locally

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m pytest                      # 31 tests
cd app && ../.venv/bin/python app.py            # http://127.0.0.1:5000
```

## Run with Docker

```bash
docker build -t water-quality-monitor:1.3.0 .
docker run -d -p 8080:8000 --read-only --tmpfs /tmp --cap-drop ALL \
  --security-opt no-new-privileges water-quality-monitor:1.3.0
curl localhost:8080/health
```

## CI stack (Jenkins + SonarQube)

```bash
cd ci
export JENKINS_HOME_DIR="$HOME/wq-jenkins-home"
export JENKINS_ADMIN_PASSWORD='<choose one>'
export SONAR_TOKEN='<token generated in SonarQube>'
docker compose up -d --build        # Jenkins :8090, SonarQube :9000
```

## Deploy to AWS

```bash
cd terraform
terraform init && terraform plan && terraform apply
terraform destroy                    # when finished
```

## Security results (Trivy)

| Image | Base | HIGH | Total findings |
|---|---|---|---|
| 1.0.0 baseline | python:3.12-slim (Debian 13) | 44 | 169 |
| 1.1.0 | python:3.12-alpine + pip upgrade | 4 | 7 |
| **1.3.0 final** | alpine + `apk upgrade`, pip removed, CSRF added | **0** | **0** |

Terraform and Dockerfile config scan: 0 failures (one documented, accepted egress rule).
SonarQube: first scan found 1 CSRF vulnerability, 3 bugs, 1 code smell (Security D); all fixed, re-scan is A/A/A with 98.6% coverage.
See `docs/vulnerability_report.md`.
