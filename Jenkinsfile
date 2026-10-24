pipeline {
    agent any

    environment {
        IMAGE = "web-app:${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'experiment-5',
                    url: 'https://github.com/jaimilshah/water-quality-devsecops.git'
            }
        }

        stage('Source Scan (Trivy)') {
            steps {
                sh '''
                    trivy fs --scanners vuln,secret \
                      --severity HIGH,CRITICAL \
                      --ignore-unfixed --exit-code 1 \
                      --skip-dirs .git,reports,docs,evidence,deliverables .
                '''
            }
        }

        stage('Build Image') {
            steps {
                sh 'docker build -t $IMAGE .'
            }
        }

        stage('Image Scan (Trivy)') {
            steps {
                sh '''
                    trivy image --severity HIGH,CRITICAL \
                      --ignore-unfixed --exit-code 1 $IMAGE
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker rm -f web-app || true'
                // the application listens on port 8000 inside the container
                sh 'docker run -d --name web-app -p 8081:8000 $IMAGE'
                sh 'sleep 5'
            }
        }

        stage('Smoke Test') {
            steps {
                // Jenkins runs inside a container, so it reaches the host's port 8081 via host.docker.internal
                sh 'curl -f http://host.docker.internal:8081/health'
            }
        }

        stage('Scan Report') {
            steps {
                sh 'trivy image --format json --output trivy-deployed.json $IMAGE'
                archiveArtifacts artifacts: 'trivy-deployed.json'
            }
        }
    }
}
