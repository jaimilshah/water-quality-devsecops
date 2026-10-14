// Declarative CI/CD pipeline: test -> SonarQube -> Trivy -> build -> scan image -> Terraform check -> deploy
pipeline {
  agent any

  options {
    timestamps()
    timeout(time: 30, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  parameters {
    booleanParam(name: 'DEPLOY_TO_AWS', defaultValue: false,
                 description: 'Run terraform apply (needs AWS credentials in Jenkins and manual approval)')
  }

  environment {
    IMAGE = "water-quality-monitor:${env.BUILD_NUMBER}"
    TRIVY_RUN = 'docker run --rm -v trivy-cache:/root/.cache/'
    TRIVY_IMG = 'aquasec/trivy:latest'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        sh 'mkdir -p reports'
      }
    }

    stage('Unit tests + coverage') {
      steps {
        sh '''
          docker run --rm -v "$PWD":/w -w /w python:3.12-slim sh -c "
            pip install -q -r requirements-dev.txt &&
            python -m pytest -q --cov=app --cov-report=xml:reports/coverage.xml --junitxml=reports/junit.xml"
        '''
      }
      post { always { junit 'reports/junit.xml' } }
    }

    stage('SonarQube analysis') {
      steps {
        withSonarQubeEnv('sonarqube') {
          sh '''
            docker run --rm -u 0 --network wq-ci-net -e SONAR_HOST_URL -e SONAR_TOKEN="${SONAR_AUTH_TOKEN:-$SONAR_TOKEN}" \
              -v "$PWD":/usr/src sonarsource/sonar-scanner-cli:latest \
              -Dsonar.working.directory=/usr/src/.scannerwork
          '''
        }
      }
    }

    stage('Quality gate') {
      steps {
        timeout(time: 5, unit: 'MINUTES') { waitForQualityGate abortPipeline: true }
      }
    }

    stage('Trivy: dependencies, secrets, IaC') {
      steps {
        sh '''
          ${TRIVY_RUN} -v "$PWD":/w -w /w ${TRIVY_IMG} fs \
            --scanners vuln,secret,misconfig --severity HIGH,CRITICAL --exit-code 1 \
            --skip-dirs .git,reports,.venv,.scannerwork,terraform/.terraform --format table .
          ${TRIVY_RUN} -v "$PWD":/w -w /w ${TRIVY_IMG} fs \
            --scanners vuln,secret,misconfig --format json -o reports/trivy-fs.json \
            --skip-dirs .git,reports,.venv,.scannerwork,terraform/.terraform .
        '''
      }
    }

    stage('Docker build') {
      steps { sh 'docker build -t ${IMAGE} .' }
    }

    stage('Trivy: image scan') {
      steps {
        sh '''
          ${TRIVY_RUN} -v /var/run/docker.sock:/var/run/docker.sock ${TRIVY_IMG} image \
            --severity HIGH,CRITICAL --exit-code 1 ${IMAGE}
          ${TRIVY_RUN} -v /var/run/docker.sock:/var/run/docker.sock -v "$PWD/reports":/out ${TRIVY_IMG} image \
            --format json -o /out/trivy-image.json ${IMAGE}
        '''
      }
    }

    stage('Terraform validate') {
      steps {
        sh '''
          docker run --rm -v "$PWD/terraform":/tf -w /tf hashicorp/terraform:1.9 fmt -check -recursive
          docker run --rm -v "$PWD/terraform":/tf -w /tf hashicorp/terraform:1.9 init -backend=false -input=false
          docker run --rm -v "$PWD/terraform":/tf -w /tf hashicorp/terraform:1.9 validate
        '''
      }
    }

    stage('Deploy (Docker)') {
      when { expression { (env.GIT_BRANCH ?: 'main') ==~ /(origin\/)?main/ } }
      steps {
        sh '''
          docker rm -f wq-deployed >/dev/null 2>&1 || true
          docker run -d --name wq-deployed --network wq-ci-net -p 8081:8000 --restart unless-stopped \
            --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges ${IMAGE}
          for i in 1 2 3 4 5 6 7 8; do curl -fsS http://wq-deployed:8000/health && break; sleep 3; done
          curl -fsS http://wq-deployed:8000/health
        '''
      }
    }

    stage('Terraform apply (AWS)') {
      when { expression { params.DEPLOY_TO_AWS } }
      steps {
        input message: 'Apply Terraform and create billable AWS resources?'
        withCredentials([usernamePassword(credentialsId: 'aws-creds',
                                          usernameVariable: 'AWS_ACCESS_KEY_ID',
                                          passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
          sh '''
            docker run --rm -e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY -v "$PWD/terraform":/tf -w /tf \
              hashicorp/terraform:1.9 init -input=false
            docker run --rm -e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY -v "$PWD/terraform":/tf -w /tf \
              hashicorp/terraform:1.9 apply -auto-approve -input=false
          '''
        }
      }
    }
  }

  post {
    always { archiveArtifacts artifacts: 'reports/**', allowEmptyArchive: true }
    success { echo 'Pipeline succeeded' }
    failure { echo 'Pipeline failed - see stage logs and reports/' }
  }
}
