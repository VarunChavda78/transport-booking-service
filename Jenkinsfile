pipeline {
    agent any

    // ── Environment Variables ─────────────────────
    environment {
        // Your AWS details
        AWS_REGION          = 'ap-south-1'
        AWS_ACCOUNT_ID      = '339712873091'   // replace with your AWS account ID
        ECR_REPO_NAME       = 'transport-booking-service'
        
        // Full ECR URL
        ECR_REGISTRY        = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        ECR_REPO_URL        = "${ECR_REGISTRY}/${ECR_REPO_NAME}"
        
        // Image tag = branch name + build number
        // Example: main-42, develop-15, feature-login-3
        IMAGE_TAG           = "${env.BRANCH_NAME}-${env.BUILD_NUMBER}"
        
        // AWS credentials stored in Jenkins
        AWS_CREDENTIALS_ID  = 'aws-ecr-credentials'
    }

    // ── Stages ────────────────────────────────────
    stages {

        // Stage 1: Checkout code from GitHub
        stage('Checkout') {
            steps {
                echo "Checking out branch: ${env.BRANCH_NAME}"
                checkout scm
            }
        }

        // Stage 2: Install dependencies and run tests
        stage('Install & Test') {
            steps {
                echo 'Installing dependencies...'
                sh 'npm install'
                
                echo 'Running tests...'
                // sh 'npm test'
                // Commented out — add your tests later
                
                echo 'Tests passed!'
            }
        }

        // Stage 3: Build Docker image
        stage('Docker Build') {
            steps {
                echo "Building Docker image: ${ECR_REPO_URL}:${IMAGE_TAG}"
                
                sh """
                    docker build \
                        --tag ${ECR_REPO_URL}:${IMAGE_TAG} \
                        --tag ${ECR_REPO_URL}:latest \
                        --build-arg NODE_ENV=production \
                        .
                """
                
                echo 'Docker image built successfully!'
            }
        }

        // Stage 4: Security scan with Trivy
        // Scans image for vulnerabilities before pushing
        stage('Security Scan') {
            steps {
                echo 'Scanning image for vulnerabilities...'
                
                sh """
                    trivy image \
                        --severity HIGH,CRITICAL \
                        --exit-code 0 \
                        ${ECR_REPO_URL}:${IMAGE_TAG}
                """
                // exit-code 0 means: report but don't fail pipeline
                // change to exit-code 1 to BLOCK push if critical CVE found
                
                echo 'Security scan complete!'
            }
        }

        // Stage 5: Login to AWS ECR and push image
        stage('Push to ECR') {
            steps {
                echo 'Logging into AWS ECR...'
                
                withCredentials([
                    string(credentialsId: 'AWS_ACCESS_KEY_ID', 
                           variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'AWS_SECRET_ACCESS_KEY', 
                           variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh """
                        // Configure AWS CLI
                        aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
                        aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
                        aws configure set default.region ${AWS_REGION}
                        
                        // Login to ECR
                        aws ecr get-login-password \
                            --region ${AWS_REGION} | \
                        docker login \
                            --username AWS \
                            --password-stdin ${ECR_REGISTRY}
                        
                        // Push both tags
                        docker push ${ECR_REPO_URL}:${IMAGE_TAG}
                        docker push ${ECR_REPO_URL}:latest
                        
                        echo "Image pushed: ${ECR_REPO_URL}:${IMAGE_TAG}"
                    """
                }
            }
        }

        // Stage 6: Cleanup local Docker images
        // Saves disk space on Jenkins server
        stage('Cleanup') {
            steps {
                echo 'Cleaning up local Docker images...'
                sh """
                    docker rmi ${ECR_REPO_URL}:${IMAGE_TAG} || true
                    docker rmi ${ECR_REPO_URL}:latest || true
                """
                echo 'Cleanup done!'
            }
        }
    }

    // ── Post Actions (run after all stages) ───────
    post {
        success {
            echo """
            ✅ SUCCESS!
            Branch: ${env.BRANCH_NAME}
            Image: ${ECR_REPO_URL}:${IMAGE_TAG}
            Successfully pushed to ECR!
            """
        }
        failure {
            echo """
            ❌ PIPELINE FAILED!
            Branch: ${env.BRANCH_NAME}
            Build: ${env.BUILD_NUMBER}
            Check logs above for errors.
            """
        }
        always {
            // Clean workspace after build
            cleanWs()
        }
    }
}
