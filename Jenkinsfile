pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'abdelrahman1212aa'
        IMAGE_TAG = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
        KUBECONFIG_PATH = '/tmp/my-k8s-config.yaml'
    }

    stages {
        stage('Validate Manifests') {
            steps {
                echo "🔍 Checking file integrity..."
                script {
                    def files = ['infra/k8s/02-database.yaml', 'infra/k8s/03-apis.yaml', 'infra/k8s/04-frontend.yaml']
                    files.each { file ->
                        sh "test -f ${file} || { echo 'Missing ${file}'; exit 1; }"
                    }
                    echo "✅ All manifest files verified."
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo "🚀 Deploying to Kubernetes Cluster..."
                
                sh "sed -i 's|image:.*|image: ${DOCKER_REGISTRY}/smart-inventory-image:${IMAGE_TAG}|g' infra/k8s/*.yaml"

                // نفذ كل أمر في سطر منفصل لتجنب مشاكل الـ Triple Quotes
                sh "docker run --rm -v ${WORKSPACE}/infra/k8s:/app/k8s -v ${KUBECONFIG_PATH}:/root/.kube/config bitnami/kubectl:latest apply -f /app/k8s/02-database.yaml"
                sh "docker run --rm -v ${WORKSPACE}/infra/k8s:/app/k8s -v ${KUBECONFIG_PATH}:/root/.kube/config bitnami/kubectl:latest apply -f /app/k8s/03-apis.yaml"
                sh "docker run --rm -v ${WORKSPACE}/infra/k8s:/app/k8s -v ${KUBECONFIG_PATH}:/root/.kube/config bitnami/kubectl:latest apply -f /app/k8s/04-frontend.yaml"
                
                echo "🎉 Deployment completed successfully!"
            }
        }
    }

    post {
        always {
            echo "Pipeline finished."
        }
        failure {
            echo "❌ Pipeline failed."
        }
    }
}