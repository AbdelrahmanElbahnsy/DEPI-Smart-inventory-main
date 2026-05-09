pipeline {
    agent any

    environment {
        // Registry & Image Tagging
        DOCKER_REGISTRY = 'abdelrahman1212aa'
        IMAGE_TAG = "${env.BUILD_NUMBER}" // Used alongside latest for versioning
        
        // Frontend Build Args
        FRONTEND_VITE_API_URL = 'http://68.221.176.92:5000/api'
        
        // Deployment Config
        AZURE_SERVER_IP = '68.221.176.92'
        // Update DEPLOY_PATH to point to the directory containing docker-compose.yml on the Azure server
        DEPLOY_PATH = '~/DEPI-Smart-inventory-main/infra/docker' 
        SSH_USER = 'azureuser' // Change this to your actual Azure VM SSH username
    }

    stages {
        stage('Docker Login') {
            steps {
                // Using docker-hub-creds as requested
                withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                    sh 'echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin'
                }
            }
        }

        stage('Parallel Build & Push') {
            parallel {
                stage('API - Backend') {
                    steps {
                        sh "docker build -t ${DOCKER_REGISTRY}/smart-inventory-api:latest -t ${DOCKER_REGISTRY}/smart-inventory-api:${IMAGE_TAG} services/backend/api"
                        sh "docker push ${DOCKER_REGISTRY}/smart-inventory-api:latest"
                        sh "docker push ${DOCKER_REGISTRY}/smart-inventory-api:${IMAGE_TAG}"
                    }
                }
                stage('API - Inventory') {
                    steps {
                        sh "docker build -t ${DOCKER_REGISTRY}/inventory-api:latest -t ${DOCKER_REGISTRY}/inventory-api:${IMAGE_TAG} services/backend/inventory-api"
                        sh "docker push ${DOCKER_REGISTRY}/inventory-api:latest"
                        sh "docker push ${DOCKER_REGISTRY}/inventory-api:${IMAGE_TAG}"
                    }
                }
                stage('API - Alert') {
                    steps {
                        sh "docker build -t ${DOCKER_REGISTRY}/smart-alert-api:latest -t ${DOCKER_REGISTRY}/smart-alert-api:${IMAGE_TAG} services/backend/alert-api"
                        sh "docker push ${DOCKER_REGISTRY}/smart-alert-api:latest"
                        sh "docker push ${DOCKER_REGISTRY}/smart-alert-api:${IMAGE_TAG}"
                    }
                }
                stage('UI - Frontend') {
                    steps {
                        // Injecting VITE_API_URL as a Build Argument
                        sh "docker build --build-arg VITE_API_URL=${FRONTEND_VITE_API_URL} -t ${DOCKER_REGISTRY}/smart-inventory-ui:latest -t ${DOCKER_REGISTRY}/smart-inventory-ui:${IMAGE_TAG} services/frontend"
                        sh "docker push ${DOCKER_REGISTRY}/smart-inventory-ui:latest"
                        sh "docker push ${DOCKER_REGISTRY}/smart-inventory-ui:${IMAGE_TAG}"
                    }
                }
            }
        }

        stage('Smart Deployment to Azure') {
            steps {
                // Using azure-ssh-creds for SSH Authentication
                sshagent(credentials: ['azure-ssh-creds']) {
                    sh """
                    ssh -o StrictHostKeyChecking=no ${SSH_USER}@${AZURE_SERVER_IP} '
                        cd ${DEPLOY_PATH} &&
                        docker-compose pull &&
                        docker-compose up -d --remove-orphans &&
                        echo "--------------------------" &&
                        echo "Containers Status:" &&
                        docker ps
                    '
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline completed successfully. All services are built, pushed, and deployed!"
            // Add Slack/Discord/Email notifications here if needed
        }
        failure {
            echo "❌ Pipeline failed! Please check the Jenkins logs to investigate."
            // Add Slack/Discord/Email notifications here if needed
        }
        always {
            echo "🧹 Cleaning up..."
            sh "docker logout || true"
            sh "docker system prune -f || true"
        }
    }
}
