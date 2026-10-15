// CI/CD pipeline: test -> SonarQube -> Trivy -> Docker build -> Trivy image scan -> deploy
pipeline {
  agent any

  environment {
    IMAGE = "water-quality-monitor:${env.BUILD_NUMBER}"
    // Trivy runs as a container; the volume keeps its vulnerability database between builds
    TRIVY = 'docker run --rm -v trivy-cache:/root/.cache/trivy'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        sh 'mkdir -p reports'
      }
    }

    stage('Unit tests') {
      steps {
        sh '''
          docker run --rm -v "$PWD":/w -w /w python:3.12-slim sh -c "
            pip install -q -r requirements-dev.txt &&
            python -m pytest -q --cov=app --cov-report=xml:reports/coverage.xml --junitxml=reports/junit.xml"
        '''
      }
    }

    stage('SonarQube scan') {
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

    stage('Trivy: scan code') {
      steps {
        sh '''
          $TRIVY -v "$PWD":/w -w /w aquasec/trivy fs --scanners vuln,secret,misconfig \
            --severity HIGH,CRITICAL --exit-code 1 --skip-dirs .git,reports,.scannerwork,terraform/.terraform .
        '''
      }
    }

    stage('Docker build') {
      steps { sh 'docker build -t $IMAGE .' }
    }

    stage('Trivy: scan image') {
      steps {
        sh '''
          $TRIVY -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image \
            --severity HIGH,CRITICAL --exit-code 1 $IMAGE
          $TRIVY -v /var/run/docker.sock:/var/run/docker.sock -v "$PWD/reports":/out aquasec/trivy image \
            --format json -o /out/trivy-image.json $IMAGE
        '''
      }
    }

    stage('Deploy') {
      steps {
        sh '''
          docker rm -f wq-deployed || true
          docker run -d --name wq-deployed --network wq-ci-net -p 8081:8000 $IMAGE
          sleep 5
          curl -f http://wq-deployed:8000/health
        '''
      }
    }
  }

  post {
    always {
      junit 'reports/junit.xml'
      archiveArtifacts artifacts: 'reports/**', allowEmptyArchive: true
    }
  }
}
