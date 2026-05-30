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

        stage('Pull Existing Images for Cache') {
            steps {
                echo "📥 Pulling existing images from Docker Hub to use as build cache..."
                sh "docker pull ${DOCKER_REGISTRY}/smart-inventory-api:latest || true"
                sh "docker pull ${DOCKER_REGISTRY}/inventory-api:latest || true"
                sh "docker pull ${DOCKER_REGISTRY}/smart-alert-api:latest || true"
                sh "docker pull ${DOCKER_REGISTRY}/smart-inventory-ui:latest || true"
            }
        }

        stage('Build API - Backend') {
            when {
                anyOf {
                    changeset "services/backend/api/**"
                    changeset "services/database/**"
                    expression { env.BUILD_NUMBER == '1' }
                }
            }
            steps {
                echo "🛠️ Building Backend API..."
                sh "docker build --cache-from ${DOCKER_REGISTRY}/smart-inventory-api:latest -f services/backend/api/Dockerfile -t ${DOCKER_REGISTRY}/smart-inventory-api:latest -t ${DOCKER_REGISTRY}/smart-inventory-api:${IMAGE_TAG} ."
                sh "docker push ${DOCKER_REGISTRY}/smart-inventory-api:latest"
                sh "docker push ${DOCKER_REGISTRY}/smart-inventory-api:${IMAGE_TAG}"
            }
        }

        stage('Build API - Inventory') {
            when {
                anyOf {
                    changeset "services/backend/inventory-api/**"
                    expression { env.BUILD_NUMBER == '1' }
                }
            }
            steps {
                echo "🛠️ Building Inventory API..."
                sh "docker build --cache-from ${DOCKER_REGISTRY}/inventory-api:latest -f services/backend/inventory-api/Dockerfile -t ${DOCKER_REGISTRY}/inventory-api:latest -t ${DOCKER_REGISTRY}/inventory-api:${IMAGE_TAG} ."
                sh "docker push ${DOCKER_REGISTRY}/inventory-api:latest"
                sh "docker push ${DOCKER_REGISTRY}/inventory-api:${IMAGE_TAG}"
            }
        }

        stage('Build API - Alert') {
            when {
                anyOf {
                    changeset "services/backend/alert-api/**"
                    expression { env.BUILD_NUMBER == '1' }
                }
            }
            steps {
                echo "🛠️ Building Alert API..."
                sh "docker build --cache-from ${DOCKER_REGISTRY}/smart-alert-api:latest -f services/backend/alert-api/Dockerfile -t ${DOCKER_REGISTRY}/smart-alert-api:latest -t ${DOCKER_REGISTRY}/smart-alert-api:${IMAGE_TAG} ."
                sh "docker push ${DOCKER_REGISTRY}/smart-alert-api:latest"
                sh "docker push ${DOCKER_REGISTRY}/smart-alert-api:${IMAGE_TAG}"
            }
        }

        stage('Build UI - Frontend') {
            when {
                anyOf {
                    changeset "services/frontend/**"
                    expression { env.BUILD_NUMBER == '1' }
                }
            }
            steps {
                echo "🛠️ Building Frontend UI..."
                sh "docker build --cache-from ${DOCKER_REGISTRY}/smart-inventory-ui:latest --build-arg VITE_API_URL=${FRONTEND_VITE_API_URL} -f services/frontend/Dockerfile -t ${DOCKER_REGISTRY}/smart-inventory-ui:latest -t ${DOCKER_REGISTRY}/smart-inventory-ui:${IMAGE_TAG} ."
                sh "docker push ${DOCKER_REGISTRY}/smart-inventory-ui:latest"
                sh "docker push ${DOCKER_REGISTRY}/smart-inventory-ui:${IMAGE_TAG}"
            }
        }

        stage('Smart Deployment to Azure') {
            when {
                anyOf {
                    changeset "services/**"
                    changeset "infra/docker/**"
                    changeset "Jenkinsfile"
                    expression { env.BUILD_NUMBER == '1' }
                }
            }
            steps {
                echo "🚀 Deploying to Azure Server..."
                // ID مطابق للـ Credentials الخاصة بالسيرفر
                sshagent(['server-ssh-credentials']) { 
                    sh '''
                    ssh -o StrictHostKeyChecking=no abdelrahman@68.221.69.163 << EOF
                        cd /home/abdelrahman/app/infra/docker
                        docker compose pull
                        docker compose down
                        docker compose up -d
                        docker image prune -f
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