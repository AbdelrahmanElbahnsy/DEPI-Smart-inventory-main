pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'abdelrahman1212aa'
        // استخراج الـ Tag من الـ Git
        IMAGE_TAG = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
    }

    stages {
        // 1. مرحلة التحقق من الملفات (بدون استخدام Docker للـ Validation)
        stage('Validate Manifests') {
            steps {
                echo "🔍 Checking file integrity..."
                script {
                    // التأكد من وجود الملفات
                    def files = ['infra/k8s/02-database.yaml', 'infra/k8s/03-apis.yaml', 'infra/k8s/04-frontend.yaml']
                    files.each { file ->
                        sh "test -f ${file} || { echo 'Missing ${file}'; exit 1; }"
                    }
                }
            }
        }

        // 2. مرحلة النشر المباشر (استخدام kubectl المثبت على السيرفر)
        stage('Deploy to Kubernetes') {
            steps {
                echo "🚀 Deploying to Kubernetes Cluster..."
                
                // تحديث الـ Images في الملفات
                sh "sed -i 's|image:.*|image: ${DOCKER_REGISTRY}/smart-inventory-image:${IMAGE_TAG}|g' infra/k8s/*.yaml"

                // النشر باستخدام kubectl مباشرة (الموجود على السيرفر)
                // تأكد أن المسار kubeconfig.yaml موجود في مجلد المشروع الرئيسي على السيرفر
                sh "kubectl --kubeconfig=${WORKSPACE}/kubeconfig.yaml apply -f infra/k8s/02-database.yaml"
                sh "kubectl --kubeconfig=${WORKSPACE}/kubeconfig.yaml apply -f infra/k8s/03-apis.yaml"
                sh "kubectl --kubeconfig=${WORKSPACE}/kubeconfig.yaml apply -f infra/k8s/04-frontend.yaml"
            }
        }
    }

    post {
        always {
            echo "Pipeline finished."
        }
    }
}