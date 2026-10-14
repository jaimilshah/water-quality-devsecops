#!/usr/bin/env bash
# Starts Jenkins + SonarQube. Secrets are read with hidden input and never written to disk.
set -euo pipefail
cd "$(dirname "$0")"

export JENKINS_HOME_DIR="${JENKINS_HOME_DIR:-$HOME/wq-jenkins-home}"
mkdir -p "$JENKINS_HOME_DIR"

read -r -s -p "Choose a Jenkins admin password: " JENKINS_ADMIN_PASSWORD; echo
read -r -s -p "SonarQube token (press Enter to skip for now): " SONAR_TOKEN; echo
export JENKINS_ADMIN_PASSWORD SONAR_TOKEN="${SONAR_TOKEN:-unset}"
export REPO_URL="${REPO_URL:-https://github.com/jaimilshah/water-quality-devsecops.git}"

docker compose up -d --build
echo
echo "SonarQube: http://localhost:9000    Jenkins: http://localhost:8090 (user: admin)"
