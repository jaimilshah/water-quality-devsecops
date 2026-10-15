# Jenkins image with the Docker CLI and AWS CLI, so pipelines can build images
# and talk to AWS. The Docker engine itself is the host's (socket is mounted at run time).
FROM jenkins/jenkins:lts-jdk21

USER root
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl git awscli \
 && install -m 0755 -d /etc/apt/keyrings \
 && curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc \
 && echo "deb [signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list \
 && apt-get update \
 && apt-get install -y --no-install-recommends docker-ce-cli \
 && rm -rf /var/lib/apt/lists/* \
 && git config --system --add safe.directory '*'

# Plugins the Jenkinsfile needs: pipeline, git, SonarQube, tests, credentials, stage view
USER jenkins
RUN jenkins-plugin-cli --plugins workflow-aggregator git sonar junit credentials-binding pipeline-stage-view
