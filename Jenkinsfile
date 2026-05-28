pipeline {
    agent any

    environment {
        // تأكد أن هذا هو اسم المستخدم الخاص بك على Docker Hub
        DOCKER_REGISTRY = 'abdelrahman1212aa'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        
        // Frontend Build Args
        FRONTEND_VITE_API_URL = '/api'
    }

    stages {
        stage('Docker Login') {
            steps {
                // ID مطابق لما هو موجود في Jenkins Credentials
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                    sh 'echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin'
                }
            }
        }

        stage('Build API - Backend') {
            steps {
                sh "docker build -f services/backend/api/Dockerfile -t ${DOCKER_REGISTRY}/smart-inventory-api:latest -t ${DOCKER_REGISTRY}/smart-inventory-api:${IMAGE_TAG} ."
                sh "docker push ${DOCKER_REGISTRY}/smart-inventory-api:latest"
                sh "docker push ${DOCKER_REGISTRY}/smart-inventory-api:${IMAGE_TAG}"
            }
        }

        stage('Build API - Inventory') {
            steps {
                sh "docker build -f services/backend/inventory-api/Dockerfile -t ${DOCKER_REGISTRY}/inventory-api:latest -t ${DOCKER_REGISTRY}/inventory-api:${IMAGE_TAG} ."
                sh "docker push ${DOCKER_REGISTRY}/inventory-api:latest"
                sh "docker push ${DOCKER_REGISTRY}/inventory-api:${IMAGE_TAG}"
            }
        }

        stage('Build API - Alert') {
            steps {
                sh "docker build -f services/backend/alert-api/Dockerfile -t ${DOCKER_REGISTRY}/smart-alert-api:latest -t ${DOCKER_REGISTRY}/smart-alert-api:${IMAGE_TAG} ."
                sh "docker push ${DOCKER_REGISTRY}/smart-alert-api:latest"
                sh "docker push ${DOCKER_REGISTRY}/smart-alert-api:${IMAGE_TAG}"
            }
        }

        stage('Build UI - Frontend') {
            steps {
                sh "docker build --no-cache --build-arg VITE_API_URL=${FRONTEND_VITE_API_URL} -f services/frontend/Dockerfile -t ${DOCKER_REGISTRY}/smart-inventory-ui:latest -t ${DOCKER_REGISTRY}/smart-inventory-ui:${IMAGE_TAG} ."
                sh "docker push ${DOCKER_REGISTRY}/smart-inventory-ui:latest"
                sh "docker push ${DOCKER_REGISTRY}/smart-inventory-ui:${IMAGE_TAG}"
            }
        }

        stage('Smart Deployment to Azure') {
            steps {
                // ID مطابق للـ Credentials الخاصة بالسيرفر
                sshagent(['server-ssh-credentials']) { 
                    sh '''
                    ssh -o StrictHostKeyChecking=no abdelrahman@68.221.69.163 << EOF
                        cd /home/abdelrahman/app/infra/docker
                        docker compose pull
                        docker compose down
                        docker compose up -d
                        echo "--------------------------"
                        echo "Containers Status:"
                        docker ps
                    EOF
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