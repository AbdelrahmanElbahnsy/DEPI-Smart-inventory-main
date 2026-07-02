pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    parameters {
        string(name: 'VITE_API_URL', defaultValue: 'http://68.221.69.163/api', description: 'API gateway URL for the frontend application')
    }

    environment {
        DOCKER_REGISTRY = 'abdelrahman1212aa'
        KUBECONFIG_PATH = '/etc/rancher/k3s/k3s.yaml'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.IMAGE_TAG = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                }
            }
        }

        stage('Validate Manifests') {
            steps {
                echo "🔍 Checking file integrity..."
                script {
                    def files = ['infra/k8s/02-database.yaml', 'infra/k8s/03-apis.yaml', 'infra/k8s/04-frontend.yaml']
                    files.each { file ->
                        sh "test -f ${file} || { echo 'Missing ${file}'; exit 1; }"
                    }
                }
            }
        }

        stage('Docker Login') {
            steps {
                script {
                    retry(3) {
                        withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                            sh "echo '${DOCKER_PASS}' | docker login -u '${DOCKER_USER}' --password-stdin"
                        }
                    }
                }
            }
        }

        stage('Parallel Build & Push') {
            steps {
                script {
                    def viteApiUrl = params.VITE_API_URL ?: env.VITE_API_URL ?: 'http://68.221.69.163/api'
                    def services = [
                        [
                            name: 'smart-inventory-api',
                            dockerfile: 'services/backend/api/Dockerfile',
                            context: '.',
                            buildArgs: ''
                        ],
                        [
                            name: 'inventory-api',
                            dockerfile: 'services/backend/inventory-api/Dockerfile',
                            context: '.',
                            buildArgs: ''
                        ],
                        [
                            name: 'smart-alert-api',
                            dockerfile: 'services/backend/alert-api/Dockerfile',
                            context: '.',
                            buildArgs: ''
                        ],
                        [
                            name: 'smart-inventory-ui',
                            dockerfile: 'services/frontend/Dockerfile',
                            context: '.',
                            buildArgs: "--build-arg VITE_API_URL=${viteApiUrl}"
                        ]
                    ]

                    def parallelBuilds = [:]

                    services.each { service ->
                        parallelBuilds[service.name] = {
                            stage("Build & Push ${service.name}") {
                                retry(3) {
                                    echo "Building ${service.name} using context ${service.context}..."
                                    sh "docker pull ${DOCKER_REGISTRY}/${service.name}:latest || true"
                                    sh "docker build --cache-from ${DOCKER_REGISTRY}/${service.name}:latest ${service.buildArgs} -t ${DOCKER_REGISTRY}/${service.name}:latest -t ${DOCKER_REGISTRY}/${service.name}:${IMAGE_TAG} -f ${service.dockerfile} ${service.context}"
                                }
                                retry(3) {
                                    echo "Pushing ${service.name}..."
                                    sh "docker push ${DOCKER_REGISTRY}/${service.name}:latest"
                                    sh "docker push ${DOCKER_REGISTRY}/${service.name}:${IMAGE_TAG}"
                                }
                                retry(3) {
                                    echo "Verifying remote pull of ${service.name}:${IMAGE_TAG}..."
                                    sh "docker rmi -f ${DOCKER_REGISTRY}/${service.name}:${IMAGE_TAG} || true"
                                    sh "docker pull ${DOCKER_REGISTRY}/${service.name}:${IMAGE_TAG}"
                                }
                            }
                        }
                    }

                    parallel parallelBuilds
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo "🚀 Deploying to Kubernetes Cluster..."
                
                // تحديث الـ Images لكل تطبيق على حدة باستخدام الـ Tag الموحد مع الحفاظ على اسم الـ Repository
                sh """
                    sed -i 's|image: .*/smart-inventory-api:.*|image: ${DOCKER_REGISTRY}/smart-inventory-api:${IMAGE_TAG}|g' infra/k8s/*.yaml
                    sed -i 's|image: .*/inventory-api:.*|image: ${DOCKER_REGISTRY}/inventory-api:${IMAGE_TAG}|g' infra/k8s/*.yaml
                    sed -i 's|image: .*/smart-alert-api:.*|image: ${DOCKER_REGISTRY}/smart-alert-api:${IMAGE_TAG}|g' infra/k8s/*.yaml
                    sed -i 's|image: .*/smart-inventory-ui:.*|image: ${DOCKER_REGISTRY}/smart-inventory-ui:${IMAGE_TAG}|g' infra/k8s/*.yaml
                """

                echo "Running Kubernetes dry-run validation..."
                sh "cat infra/k8s/02-database.yaml | docker run --network host --user root --rm -i -v ${KUBECONFIG_PATH}:/tmp/config -e KUBECONFIG=/tmp/config bitnami/kubectl:latest apply --dry-run=client -f -"
                sh "cat infra/k8s/03-apis.yaml | docker run --network host --user root --rm -i -v ${KUBECONFIG_PATH}:/tmp/config -e KUBECONFIG=/tmp/config bitnami/kubectl:latest apply --dry-run=client -f -"
                sh "cat infra/k8s/04-frontend.yaml | docker run --network host --user root --rm -i -v ${KUBECONFIG_PATH}:/tmp/config -e KUBECONFIG=/tmp/config bitnami/kubectl:latest apply --dry-run=client -f -"

                echo "Applying Kubernetes manifests..."
                sh "cat infra/k8s/02-database.yaml | docker run --network host --user root --rm -i -v ${KUBECONFIG_PATH}:/tmp/config -e KUBECONFIG=/tmp/config bitnami/kubectl:latest apply -f -"
                sh "cat infra/k8s/03-apis.yaml | docker run --network host --user root --rm -i -v ${KUBECONFIG_PATH}:/tmp/config -e KUBECONFIG=/tmp/config bitnami/kubectl:latest apply -f -"
                sh "cat infra/k8s/04-frontend.yaml | docker run --network host --user root --rm -i -v ${KUBECONFIG_PATH}:/tmp/config -e KUBECONFIG=/tmp/config bitnami/kubectl:latest apply -f -"
            }
        }

        stage('Verify Rollouts') {
            steps {
                script {
                    def deployments = ['smart-inventory-db', 'backend', 'inventory-api', 'alert-api', 'frontend']
                    deployments.each { dep ->
                        echo "Verifying rollout status for deployment/${dep}..."
                        try {
                            sh "docker run --network host --user root --rm -v ${KUBECONFIG_PATH}:/tmp/config -e KUBECONFIG=/tmp/config bitnami/kubectl:latest rollout status deployment/${dep} --timeout=120s"
                        } catch (Exception e) {
                            echo "❌ Rollout failed for deployment/${dep}! Initiating rollback for this deployment only..."
                            sh "docker run --network host --user root --rm -v ${KUBECONFIG_PATH}:/tmp/config -e KUBECONFIG=/tmp/config bitnami/kubectl:latest rollout undo deployment/${dep} || true"
                            error("Deployment rollout failed and was rolled back: ${dep}")
                        }
                    }
                }
            }
        }

        stage('Health Checks') {
            steps {
                echo "Running service health checks on host interface..."
                sh """
                    for i in {1..10}; do
                        if docker run --network host --rm curlimages/curl:latest -s -f http://127.0.0.1/ > /dev/null && docker run --network host --rm curlimages/curl:latest -s -f http://127.0.0.1/api/health > /dev/null; then
                            echo "✅ All services are healthy!"
                            exit 0
                        fi
                        echo "Waiting for services to become ready..."
                        sleep 5
                    done
                    echo "❌ Health checks failed!"
                    exit 1
                """
            }
        }

        stage('Clean local images') {
            steps {
                script {
                    echo "Cleaning local build images..."
                    sh "docker image prune -af || true"
                }
            }
        }
    }

    post {
        always {
            sh "docker logout || true"
            cleanWs()
        }
    }
}