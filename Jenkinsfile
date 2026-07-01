pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'abdelrahman1212aa'
        // استخراج الـ Tag بناءً على الـ Git Commit
        IMAGE_TAG = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
    }

    stages {
        // 1. مرحلة التنسيق والمراجعة (Validation Stage)
        stage('Validate & Sync Manifests') {
            steps {
                echo "🔍 Checking file integrity and sync..."
                script {
                    // التأكد من وجود الملفات قبل البدء
                    sh "test -f infra/k8s/02-database.yaml || { echo 'Missing 02-database.yaml'; exit 1; }"
                    sh "test -f infra/k8s/03-apis.yaml || { echo 'Missing 03-apis.yaml'; exit 1; }"
                    sh "test -f infra/k8s/04-frontend.yaml || { echo 'Missing 04-frontend.yaml'; exit 1; }"

                    // التأكد من صحة التنسيق (Linting) باستخدام الـ Dry-run
                    echo "Checking YAML syntax..."
                    sh "docker run --rm -v ${WORKSPACE}/infra/k8s:/app/k8s bitnami/kubectl:latest apply --dry-run=client -f /app/k8s/"
                }
            }
        }

        // 2. مرحلة تحديث الصور ونشرها
        stage('Deploy to Kubernetes') {
            steps {
                echo "🚀 Syncing Images and Deploying..."
                
                // تحديث الـ Image Tags في جميع الملفات دفعة واحدة لضمان التوافق
                // سيقوم هذا الأمر باستبدال أي سطر يبدأ بـ image: بـ الـ Tag الجديد
                sh "sed -i 's|image:.*|image: ${DOCKER_REGISTRY}/smart-inventory-image:${IMAGE_TAG}|g' infra/k8s/*.yaml"

                script {
                    def kubeconfig = readFile('kubeconfig.yaml')
                    writeFile file: 'tmp_kubeconfig', text: kubeconfig
                    
                    // استخدام الـ Pipe لإرسال المحتوى مباشرة للـ Cluster
                    def manifests = ['02-database.yaml', '03-apis.yaml', '04-frontend.yaml']
                    manifests.each { file ->
                        echo "Applying ${file}..."
                        sh "cat infra/k8s/${file} | docker run --rm -i -v ${WORKSPACE}/tmp_kubeconfig:/root/.kube/config bitnami/kubectl:latest apply -f -"
                    }
                }
            }
        }
    }

    post {
        always {
            sh "rm -f tmp_kubeconfig"
            sh "docker system prune -f || true"
        }
    }
}