pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'abdelrahman1212aa'
        // استخراج الـ Tag من الـ Git للتوحيد
        IMAGE_TAG = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
        // المسار الجديد والمضمون للـ Kubeconfig بعد نقله لـ /tmp
        KUBECONFIG_PATH = '/tmp/my-k8s-config.yaml'
    }

    stages {
        // 1. مرحلة التحقق من الملفات (Validation)
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
                
                // تحديث الـ Images
                sh "sed -i 's|image:.*|image: ${DOCKER_REGISTRY}/smart-inventory-image:${IMAGE_TAG}|g' infra/k8s/*.yaml"

                // استخدام الـ bitnami/kubectl كـ CLI ونمرر له ملف الكونفيج كـ Volume
                // ده الحل اللي هيشتغل داخل الحاوية 100%
                sh """
                docker run --rm \
                -v ${WORKSPACE}/infra/k8s:/app/k8s \
                -v /tmp/my-k8s-config.yaml:/root/.kube/config \
                bitnami/kubectl:latest apply -f /app/k8s/02-database.yaml
                
                docker run --rm \
                -v ${WORKSPACE}/infra/k8s:/app/k8s \
                -v /tmp/my-k8s-config.yaml:/root/.kube/config \
                bitnami/kubectl:latest apply -f /app/k8s/03-apis.yaml
                
                docker run --rm \
                -v ${WORKSPACE}/infra/k8s:/app/k8s \
                -v /tmp/my-k8s-config.yaml:/root/.kube/config \
                bitnami/kubectl:latest apply -f /app/k8s/04-frontend.yaml
                """
            }
        }