pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'abdelrahman1212aa'
        IMAGE_TAG = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
        FRONTEND_VITE_API_URL = '/api'
        
        BACKEND_IMAGE   = 'smart-inventory-backend'
        INVENTORY_IMAGE = 'smart-inventory-inventory-api'
        ALERT_IMAGE     = 'smart-inventory-alert-api'
        FRONTEND_IMAGE  = 'smart-inventory-ui'
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
                echo "📥 Pulling existing images from Docker Hub..."
                sh "docker pull ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:latest || true"
                sh "docker pull ${DOCKER_REGISTRY}/${INVENTORY_IMAGE}:latest || true"
                sh "docker pull ${DOCKER_REGISTRY}/${ALERT_IMAGE}:latest || true"
                sh "docker pull ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:latest || true"
            }
        }

        // ... (مراحل الـ Build كما هي) ...
        stage('Build API - Backend') {
            when { anyOf { changeset "services/backend/api/**"; changeset "services/database/**"; expression { env.BUILD_NUMBER == '1' } } }
            steps {
                sh "docker build -t ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:latest -t ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:${IMAGE_TAG} -f services/backend/api/Dockerfile ."
                sh "docker push ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:latest && docker push ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:${IMAGE_TAG}"
            }
        }

        stage('Build API - Inventory') {
            when { anyOf { changeset "services/backend/inventory-api/**"; expression { env.BUILD_NUMBER == '1' } } }
            steps {
                sh "docker build -t ${DOCKER_REGISTRY}/${INVENTORY_IMAGE}:latest -t ${DOCKER_REGISTRY}/${INVENTORY_IMAGE}:${IMAGE_TAG} -f services/backend/inventory-api/Dockerfile ."
                sh "docker push ${DOCKER_REGISTRY}/${INVENTORY_IMAGE}:latest && docker push ${DOCKER_REGISTRY}/${INVENTORY_IMAGE}:${IMAGE_TAG}"
            }
        }

        stage('Build API - Alert') {
            when { anyOf { changeset "services/backend/alert-api/**"; expression { env.BUILD_NUMBER == '1' } } }
            steps {
                sh "docker build -t ${DOCKER_REGISTRY}/${ALERT_IMAGE}:latest -t ${DOCKER_REGISTRY}/${ALERT_IMAGE}:${IMAGE_TAG} -f services/backend/alert-api/Dockerfile ."
                sh "docker push ${DOCKER_REGISTRY}/${ALERT_IMAGE}:latest && docker push ${DOCKER_REGISTRY}/${ALERT_IMAGE}:${IMAGE_TAG}"
            }
        }

        stage('Build UI - Frontend') {
            when { anyOf { changeset "services/frontend/**"; expression { env.BUILD_NUMBER == '1' } } }
            steps {
                sh "docker build --build-arg VITE_API_URL=${FRONTEND_VITE_API_URL} -t ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:latest -t ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:${IMAGE_TAG} -f services/frontend/Dockerfile ."
                sh "docker push ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:latest && docker push ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:${IMAGE_TAG}"
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo "🚀 Deploying Smart Inventory..."
                
                // تحديث المانيفستس
                sh "sed -i 's|${DOCKER_REGISTRY}/smart-inventory-backend:latest|${DOCKER_REGISTRY}/${BACKEND_IMAGE}:${IMAGE_TAG}|g' infra/k8s/03-apis.yaml"
                sh "sed -i 's|${DOCKER_REGISTRY}/smart-inventory-inventory-api:latest|${DOCKER_REGISTRY}/${INVENTORY_IMAGE}:${IMAGE_TAG}|g' infra/k8s/03-apis.yaml"
                sh "sed -i 's|${DOCKER_REGISTRY}/smart-inventory-alert-api:latest|${DOCKER_REGISTRY}/${ALERT_IMAGE}:${IMAGE_TAG}|g' infra/k8s/03-apis.yaml"
                sh "sed -i 's|${DOCKER_REGISTRY}/smart-inventory-ui:latest|${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:${IMAGE_TAG}|g' infra/k8s/04-frontend.yaml"

                // الحل النهائي: إنشاء ملف مؤقت داخل الكونتينر باستخدام cat
                script {
                    def kubeconfig = readFile('kubeconfig.yaml')
                    sh """
                    docker run --rm -v ${WORKSPACE}/infra/k8s:/app/k8s bitnami/kubectl:latest sh -c \
                    "echo '${kubeconfig}' > /tmp/config && export KUBECONFIG=/tmp/config && \
                    kubectl apply -f /app/k8s/02-database.yaml && \
                    kubectl apply -f /app/k8s/03-apis.yaml && \
                    kubectl apply -f /app/k8s/04-frontend.yaml"
                    """
                }
            }
        }
    }

    post {
        always {
            sh "docker logout || true"
            sh "docker system prune -f || true"
        }
    }
}