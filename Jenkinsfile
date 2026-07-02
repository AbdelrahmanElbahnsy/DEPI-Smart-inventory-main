pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'abdelrahman1212aa'
        // استخراج الـ Tag من الـ Git للتوحيد
        IMAGE_TAG = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
        // المسار الثابت للـ Kubeconfig على السيرفر
        KUBECONFIG_PATH = '/etc/rancher/k3s/k3s.yaml'
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
                
                // تحديث الـ Images لكل تطبيق على حدة باستخدام الـ Tag الموحد مع الحفاظ على اسم الـ Repository
                sh """
                    sed -i 's|image: .*/smart-inventory-api:.*|image: ${DOCKER_REGISTRY}/smart-inventory-api:${IMAGE_TAG}|g' infra/k8s/*.yaml
                    sed -i 's|image: .*/inventory-api:.*|image: ${DOCKER_REGISTRY}/inventory-api:${IMAGE_TAG}|g' infra/k8s/*.yaml
                    sed -i 's|image: .*/smart-alert-api:.*|image: ${DOCKER_REGISTRY}/smart-alert-api:${IMAGE_TAG}|g' infra/k8s/*.yaml
                    sed -i 's|image: .*/smart-inventory-ui:.*|image: ${DOCKER_REGISTRY}/smart-inventory-ui:${IMAGE_TAG}|g' infra/k8s/*.yaml
                """

                // التحقق من الاتصال بالـ Cluster كخطوة تصحيح مؤقتة
                sh "docker run --network host --user root --rm -v ${KUBECONFIG_PATH}:/tmp/config -e KUBECONFIG=/tmp/config bitnami/kubectl:latest cluster-info"

                // النشر باستخدام Pipe لإرسال المحتوى مباشرة للـ kubectl (تجنب مشاكل الـ Path) مع مشاركة شبكة المضيف وتشغيل كـ root
                sh "cat infra/k8s/02-database.yaml | docker run --network host --user root --rm -i -v ${KUBECONFIG_PATH}:/tmp/config -e KUBECONFIG=/tmp/config bitnami/kubectl:latest apply -f -"
                sh "cat infra/k8s/03-apis.yaml | docker run --network host --user root --rm -i -v ${KUBECONFIG_PATH}:/tmp/config -e KUBECONFIG=/tmp/config bitnami/kubectl:latest apply -f -"
                sh "cat infra/k8s/04-frontend.yaml | docker run --network host --user root --rm -i -v ${KUBECONFIG_PATH}:/tmp/config -e KUBECONFIG=/tmp/config bitnami/kubectl:latest apply -f -"
                
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