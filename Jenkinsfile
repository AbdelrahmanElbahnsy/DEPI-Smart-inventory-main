pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'abdelrahman1212aa'
        // استخراج الـ Tag من الـ Git للتوحيد
        IMAGE_TAG = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
        // المسار الثابت للـ Kubeconfig على السيرفر
        KUBECONFIG_PATH = '/tmp/my-k8s-config.yaml'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
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

        stage('Deploy to Kubernetes') {
            steps {
                echo "🚀 Deploying to Kubernetes Cluster..."
                
                // تحديث الـ Images في جميع الملفات دفعة واحدة باستخدام الـ Tag الموحد
                sh "sed -i 's|image:.*|image: ${DOCKER_REGISTRY}/smart-inventory-image:${IMAGE_TAG}|g' infra/k8s/*.yaml"

                // النشر باستخدام Pipe لإرسال المحتوى مباشرة للـ kubectl (تجنب مشاكل الـ Path)
                sh "cat infra/k8s/02-database.yaml | docker run --rm -i -v ${KUBECONFIG_PATH}:/root/.kube/config bitnami/kubectl:latest apply -f -"
                sh "cat infra/k8s/03-apis.yaml | docker run --rm -i -v ${KUBECONFIG_PATH}:/root/.kube/config bitnami/kubectl:latest apply -f -"
                sh "cat infra/k8s/04-frontend.yaml | docker run --rm -i -v ${KUBECONFIG_PATH}:/root/.kube/config bitnami/kubectl:latest apply -f -"
                
                echo "🎉 Deployment completed successfully!"
            }
        }
    }

    post {
        always {
            echo "Pipeline finished."
        }
    }
}