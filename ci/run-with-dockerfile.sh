#!/usr/bin/env bash
# Starts Jenkins + SonarQube with plain Dockerfile + docker build/run (no docker compose).
# Equivalent to ci/docker-compose.yml. Secrets are read with hidden input and never written to disk.
set -euo pipefail
cd "$(dirname "$0")"

export JENKINS_HOME_DIR="${JENKINS_HOME_DIR:-$HOME/wq-jenkins-home}"
mkdir -p "$JENKINS_HOME_DIR"
read -r -s -p "Choose a Jenkins admin password: " JENKINS_ADMIN_PASSWORD; echo
read -r -s -p "SonarQube token (press Enter to skip for now): " SONAR_TOKEN; echo
SONAR_TOKEN="${SONAR_TOKEN:-unset}"
REPO_URL="${REPO_URL:-https://github.com/jaimilshah/water-quality-devsecops.git}"

# 1. Shared network so Jenkins can reach SonarQube by name
docker network create wq-ci-net 2>/dev/null || true

# 2. SonarQube (official image)
docker run -d --name wq-sonarqube --network wq-ci-net --network-alias sonarqube \
  -p 127.0.0.1:9000:9000 \
  -e SONAR_SEARCH_JAVAADDITIONALOPTS="-Dnode.store.allow_mmap=false" \
  -e SONAR_VALIDATEWEBHOOKS=false \
  -v sonar_data:/opt/sonarqube/data -v sonar_logs:/opt/sonarqube/logs \
  -v sonar_extensions:/opt/sonarqube/extensions \
  sonarqube:lts-community

# 3. Jenkins (built from ci/Dockerfile.jenkins)
docker build -t wq-ci-jenkins -f Dockerfile.jenkins .
docker run -d --name wq-jenkins --network wq-ci-net --network-alias jenkins --user root \
  -p 127.0.0.1:8090:8080 \
  -e JENKINS_HOME="$JENKINS_HOME_DIR" \
  -e JENKINS_ADMIN_PASSWORD="$JENKINS_ADMIN_PASSWORD" \
  -e SONAR_TOKEN="$SONAR_TOKEN" \
  -e REPO_URL="$REPO_URL" \
  -v "$JENKINS_HOME_DIR:$JENKINS_HOME_DIR" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "$(cd .. && pwd):/repo:ro" \
  wq-ci-jenkins

echo
echo "SonarQube: http://localhost:9000    Jenkins: http://localhost:8090 (user: admin)"
