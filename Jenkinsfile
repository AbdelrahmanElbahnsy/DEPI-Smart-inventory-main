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
                echo "📥 Pulling existing images from Docker Hub to use as build cache..."
                sh "docker pull ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:latest || true"
                sh "docker pull ${DOCKER_REGISTRY}/${INVENTORY_IMAGE}:latest || true"
                sh "docker pull ${DOCKER_REGISTRY}/${ALERT_IMAGE}:latest || true"
                sh "docker pull ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:latest || true"
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
                sh "docker build --cache-from ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:latest -f services/backend/api/Dockerfile -t ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:latest -t ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:${IMAGE_TAG} ."
                sh "docker push ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:latest"
                sh "docker push ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:${IMAGE_TAG}"
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
                sh "docker build --cache-from ${DOCKER_REGISTRY}/${INVENTORY_IMAGE}:latest -f services/backend/inventory-api/Dockerfile -t ${DOCKER_REGISTRY}/${INVENTORY_IMAGE}:latest -t ${DOCKER_REGISTRY}/${INVENTORY_IMAGE}:${IMAGE_TAG} ."
                sh "docker push ${DOCKER_REGISTRY}/${INVENTORY_IMAGE}:latest"
                sh "docker push ${DOCKER_REGISTRY}/${INVENTORY_IMAGE}:${IMAGE_TAG}"
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
                sh "docker build --cache-from ${DOCKER_REGISTRY}/${ALERT_IMAGE}:latest -f services/backend/alert-api/Dockerfile -t ${DOCKER_REGISTRY}/${ALERT_IMAGE}:latest -t ${DOCKER_REGISTRY}/${ALERT_IMAGE}:${IMAGE_TAG} ."
                sh "docker push ${DOCKER_REGISTRY}/${ALERT_IMAGE}:latest"
                sh "docker push ${DOCKER_REGISTRY}/${ALERT_IMAGE}:${IMAGE_TAG}"
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
                sh "docker build --cache-from ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:latest --build-arg VITE_API_URL=${FRONTEND_VITE_API_URL} -f services/frontend/Dockerfile -t ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:latest -t ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:${IMAGE_TAG} ."
                sh "docker push ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:latest"
                sh "docker push ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:${IMAGE_TAG}"
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo "🚀 Deploying Smart Inventory to Kubernetes Cluster..."
                
                // Update manifests with current image tag
                sh "sed -i 's|${DOCKER_REGISTRY}/smart-inventory-backend:latest|${DOCKER_REGISTRY}/${BACKEND_IMAGE}:${IMAGE_TAG}|g' infra/k8s/03-apis.yaml"
                sh "sed -i 's|${DOCKER_REGISTRY}/smart-inventory-inventory-api:latest|${DOCKER_REGISTRY}/${INVENTORY_IMAGE}:${IMAGE_TAG}|g' infra/k8s/03-apis.yaml"
                sh "sed -i 's|${DOCKER_REGISTRY}/smart-inventory-alert-api:latest|${DOCKER_REGISTRY}/${ALERT_IMAGE}:${IMAGE_TAG}|g' infra/k8s/03-apis.yaml"
                sh "sed -i 's|${DOCKER_REGISTRY}/smart-inventory-ui:latest|${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:${IMAGE_TAG}|g' infra/k8s/04-frontend.yaml"

                // Apply manifests one by one to avoid directory reading errors
                sh "docker run --rm -v ${WORKSPACE}/kubeconfig.yaml:/root/.kube/config -v ${WORKSPACE}/infra/k8s:/app/k8s bitnami/kubectl:latest apply -f /app/k8s/02-database.yaml"
                sh "docker run --rm -v ${WORKSPACE}/kubeconfig.yaml:/root/.kube/config -v ${WORKSPACE}/infra/k8s:/app/k8s bitnami/kubectl:latest apply -f /app/k8s/03-apis.yaml"
                sh "docker run --rm -v ${WORKSPACE}/kubeconfig.yaml:/root/.kube/config -v ${WORKSPACE}/infra/k8s:/app/k8s bitnami/kubectl:latest apply -f /app/k8s/04-frontend.yaml"
                
                // Status check
                sh "docker run --rm -v ${WORKSPACE}/kubeconfig.yaml:/root/.kube/config bitnami/kubectl:latest rollout status deployment/smart_inventory_api --timeout=120s"
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