pipeline {
    agent {
        docker {
            image 'docker:24.0.5-dind'
            label 'docker-agent'
            // الربط بالـ socket عشان الـ agent يقدر يعمل build و push
            args '-v /var/run/docker.sock:/var/run/docker.sock' 
        }
    }

    environment {
        DOCKER_REGISTRY = 'abdelrahman1212aa'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        FRONTEND_VITE_API_URL = '/api'
    }

    stages {
        stage('Docker Login') {
            steps {
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
            steps {
                echo "🚀 Deploying to Azure Server..."
                sshagent(['server-ssh-credentials']) { 
                    sh '''
                    ssh -o StrictHostKeyChecking=no abdelrahman@68.221.69.163 << EOF
                        cd /home/abdelrahman/app/infra/docker
                        docker compose pull
                        docker compose down
                        docker compose up -d
                        docker image prune -f
                    EOF
                    '''
                }
            }
        }
    }

    post {
        success { echo "✅ Pipeline completed successfully!" }
        failure { echo "❌ Pipeline failed!" }
        always {
            sh "docker logout || true"
            sh "docker system prune -f || true"
        }
    }
}