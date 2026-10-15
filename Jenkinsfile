// CI/CD pipeline: checkout -> tests -> SonarQube -> build image -> Trivy scan -> push to AWS ECR -> deploy
pipeline {
  agent any

  parameters {
    string(name: 'BRANCH', defaultValue: 'main', description: 'Git branch to build')
  }

  environment {
    IMAGE_NAME = 'water-quality-monitor'
    IMAGE_TAG  = "${env.BUILD_NUMBER}"
    REPO_URL   = 'https://github.com/jaimilshah/water-quality-devsecops.git'
    ECR_REGION = 'us-east-1'   // Public ECR is always in us-east-1
    // Trivy runs as a container; the volume keeps its vulnerability database between builds
    TRIVY = 'docker run --rm -v trivy-cache:/root/.cache/trivy'
  }

  stages {
    stage('Checkout') {
      steps {
        git branch: "${params.BRANCH}", url: "${REPO_URL}"
        sh 'mkdir -p reports'
      }
    }

    stage('Unit Tests') {
      steps {
        sh '''
          docker run --rm -v "$PWD":/w -w /w python:3.12-slim sh -c "
            pip install -q -r requirements-dev.txt &&
            python -m pytest -q --cov=app --cov-report=xml:reports/coverage.xml --junitxml=reports/junit.xml"
        '''
      }
    }

    stage('SonarQube Scan') {
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

    stage('Quality Gate') {
      steps {
        timeout(time: 5, unit: 'MINUTES') { waitForQualityGate abortPipeline: true }
      }
    }

    stage('Build Docker Image') {
      steps { sh 'docker build -t $IMAGE_NAME:$IMAGE_TAG .' }
    }

    stage('Trivy Scan') {
      steps {
        sh '''
          # 1) HTML + JSON reports (never fails)
          $TRIVY -v /var/run/docker.sock:/var/run/docker.sock -v "$PWD/reports":/out aquasec/trivy image \
            --format template --template "@contrib/html.tpl" -o /out/trivy-report.html $IMAGE_NAME:$IMAGE_TAG
          $TRIVY -v /var/run/docker.sock:/var/run/docker.sock -v "$PWD/reports":/out aquasec/trivy image \
            --format json -o /out/trivy-image.json $IMAGE_NAME:$IMAGE_TAG
          # 2) Fail the build on HIGH or CRITICAL findings
          $TRIVY -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image \
            --severity HIGH,CRITICAL --exit-code 1 $IMAGE_NAME:$IMAGE_TAG
        '''
      }
    }

    stage('Push to AWS ECR') {
      steps {
        withCredentials([string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                         string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')]) {
          sh '''
            AWS="docker run --rm -e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY -e AWS_DEFAULT_REGION=$ECR_REGION amazon/aws-cli"
            # create the public repository on first run (ignored if it already exists)
            $AWS ecr-public create-repository --repository-name $IMAGE_NAME >/dev/null 2>&1 || true
            ALIAS=$($AWS ecr-public describe-registries --query 'registries[0].registryAlias' --output text)
            ECR=public.ecr.aws/$ALIAS/$IMAGE_NAME
            $AWS ecr-public get-login-password | docker login --username AWS --password-stdin public.ecr.aws
            docker tag $IMAGE_NAME:$IMAGE_TAG $ECR:$IMAGE_TAG
            docker tag $IMAGE_NAME:$IMAGE_TAG $ECR:latest
            docker push $ECR:$IMAGE_TAG
            docker push $ECR:latest
            echo "Pushed: $ECR:$IMAGE_TAG"
          '''
        }
      }
    }

    stage('Deploy') {
      steps {
        sh '''
          docker rm -f wq-deployed || true
          docker run -d --name wq-deployed --network wq-ci-net -p 8081:8000 $IMAGE_NAME:$IMAGE_TAG
          sleep 5
          curl -f http://wq-deployed:8000/health
        '''
      }
    }
  }

  post {
    always {
      junit allowEmptyResults: true, testResults: 'reports/junit.xml'
      archiveArtifacts artifacts: 'reports/**', allowEmptyArchive: true
    }
  }
}
