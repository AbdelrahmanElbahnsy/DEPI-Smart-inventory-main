pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'abdelrahman1212aa'
        // استخراج الـ Tag من الـ Git للتوحيد
        IMAGE_TAG = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
        // المسار الثابت للـ Kubeconfig الذي تأكدنا من وجوده
        KUBECONFIG_PATH = '/var/jenkins_home/workspace/Smart-Inventory-Pipeline/kubeconfig.yaml'
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

        // 2. مرحلة النشر (Deployment)
        stage('Deploy to Kubernetes') {
            steps {
                echo "🚀 Deploying to Kubernetes Cluster..."
                
                // تحديث الـ Images في جميع الملفات دفعة واحدة باستخدام الـ Tag الموحد
                sh "sed -i 's|image:.*|image: ${DOCKER_REGISTRY}/smart-inventory-image:${IMAGE_TAG}|g' infra/k8s/*.yaml"

                // النشر باستخدام kubectl المثبت على السيرفر (نستخدم المسار الثابت للـ Kubeconfig)
                sh "kubectl --kubeconfig=${KUBECONFIG_PATH} apply -f infra/k8s/02-database.yaml"
                sh "kubectl --kubeconfig=${KUBECONFIG_PATH} apply -f infra/k8s/03-apis.yaml"
                sh "kubectl --kubeconfig=${KUBECONFIG_PATH} apply -f infra/k8s/04-frontend.yaml"
                
                echo "🎉 Deployment completed successfully using tag: ${IMAGE_TAG}"
            }
        }
    }

    post {
        always {
            echo "Pipeline finished."
        }
        failure {
            echo "❌ Pipeline failed. Please check the logs above."
        }
    }
}