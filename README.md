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
| CI/CD | Jenkins declarative pipeline, image pushed to AWS ECR | `Jenkinsfile`, `ci/` |
| Infrastructure | Terraform on AWS (VPC, subnet, security group, Ubuntu 22.04 EC2 that pulls the image from ECR) | `terraform/` |
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

Plain Docker commands, no compose file. Full steps in [`ci/README.md`](ci/README.md).

```bash
cd ci
docker network create wq-ci-net
docker run -d --name sonarqube --network wq-ci-net -p 9000:9000 sonarqube:lts-community
docker build -t jenkins-docker:lts .
docker run -d --name jenkins --user root --network wq-ci-net -p 8090:8080 \
  -e JENKINS_HOME=$HOME/jenkins_home -v $HOME/jenkins_home:$HOME/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock jenkins-docker:lts
```

## Deploy to AWS

The server is an Ubuntu EC2 machine. On first boot it installs Docker and runs the image that Jenkins
pushed to AWS public ECR (`public.ecr.aws/v0x5n8i4/water-quality-monitor:latest`) on port 80.

```bash
aws ec2 create-key-pair --key-name wq-key --region ap-south-1 --query KeyMaterial --output text > ~/.ssh/wq-key.pem
chmod 400 ~/.ssh/wq-key.pem
cd terraform
terraform init
terraform plan -var="key_name=wq-key"
terraform apply -var="key_name=wq-key"      # prints instance_public_ip, wait ~3 min
ssh -i ~/.ssh/wq-key.pem ubuntu@<instance_public_ip>   # then: docker ps
terraform destroy -var="key_name=wq-key"    # when finished
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
