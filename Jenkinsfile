pipeline {
    agent any

    environment {
        // Registry & Image Tagging
        DOCKER_REGISTRY = 'abdelrahman1212aa'
        IMAGE_TAG = "${env.BUILD_NUMBER}" // Used alongside latest for versioning
        
        // Frontend Build Args
        FRONTEND_VITE_API_URL = 'http://68.221.176.92:5000/api'
    }

    stages {
        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                    sh '''
                    echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
                    '''
                }
            }
        }

        stage('Parallel Build & Push') {
            parallel {
                stage('API - Backend') {
                    steps {
                        // Added -f and changed context to .
                        sh "docker build -f services/backend/api/Dockerfile -t ${DOCKER_REGISTRY}/smart-inventory-api:latest -t ${DOCKER_REGISTRY}/smart-inventory-api:${IMAGE_TAG} ."
                        sh "docker push ${DOCKER_REGISTRY}/smart-inventory-api:latest"
                        sh "docker push ${DOCKER_REGISTRY}/smart-inventory-api:${IMAGE_TAG}"
                    }
                }
                stage('API - Inventory') {
                    steps {
                        sh "docker build -f services/backend/inventory-api/Dockerfile -t ${DOCKER_REGISTRY}/inventory-api:latest -t ${DOCKER_REGISTRY}/inventory-api:${IMAGE_TAG} ."
                        sh "docker push ${DOCKER_REGISTRY}/inventory-api:latest"
                        sh "docker push ${DOCKER_REGISTRY}/inventory-api:${IMAGE_TAG}"
                    }
                }
                stage('API - Alert') {
                    steps {
                        sh "docker build -f services/backend/alert-api/Dockerfile -t ${DOCKER_REGISTRY}/smart-alert-api:latest -t ${DOCKER_REGISTRY}/smart-alert-api:${IMAGE_TAG} ."
                        sh "docker push ${DOCKER_REGISTRY}/smart-alert-api:latest"
                        sh "docker push ${DOCKER_REGISTRY}/smart-alert-api:${IMAGE_TAG}"
                    }
                }
                stage('UI - Frontend') {
                    steps {
                        sh "docker build --build-arg VITE_API_URL=${FRONTEND_VITE_API_URL} -f services/frontend/Dockerfile -t ${DOCKER_REGISTRY}/smart-inventory-ui:latest -t ${DOCKER_REGISTRY}/smart-inventory-ui:${IMAGE_TAG} ."
                        sh "docker push ${DOCKER_REGISTRY}/smart-inventory-ui:latest"
                        sh "docker push ${DOCKER_REGISTRY}/smart-inventory-ui:${IMAGE_TAG}"
                    }
                }
            }
        }

        stage('Smart Deployment to Azure') {
            steps {
                dir('infra/docker') { 
                    sh '''
                    docker-compose pull
                    docker-compose up -d --remove-orphans
                    echo "--------------------------"
                    echo "Containers Status:"
                    docker ps
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline completed successfully. All services are built, pushed, and deployed!"
        }
        failure {
            echo "❌ Pipeline failed! Please check the Jenkins logs to investigate."
        }
        always {
            echo "🧹 Cleaning up..."
            sh "docker logout || true"
            sh "docker system prune -f || true"
        }
    }
}