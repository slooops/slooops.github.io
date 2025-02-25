// codectl version : 1.5.2
pipeline {
    agent any

    tools {
        maven 'Maven-3.3.1'
        jdk 'JDK_11.0.3'
    }

    stages {
        stage('Pre-Build') {
            when {
                expression { env.BRANCH_NAME == 'develop' }
            }
            steps {
                notifyBuildStart()
            }
        }

        stage('Build Server') {
            when {
                expression { env.BRANCH_NAME == 'develop' }
            }
            steps {
                dir("revenue-monitoring-server") {
                    sh "mvn -DskipTests clean package"
                    dockerBuild()
                    sh "docker tag containers.cisco.com/it_cvc_order_to_cash/rev-ops-monitoring:$GIT_COMMIT containers.cisco.com/it_cvc_order_to_cash/rev-ops-monitoring:server-$GIT_COMMIT"
                }
            }
        }

        stage('Push Server') {
            when {
                expression { env.BRANCH_NAME == 'develop' }
            }
            steps {
                sh "pwd"
                dockerPush(
                    image: "containers.cisco.com/it_cvc_order_to_cash/rev-ops-monitoring:server-$GIT_COMMIT"
                )
                notifyDocker()
            }
        }

        stage('Deploy Server') {
            when {
                expression { env.BRANCH_NAME == 'develop' }
            }
            steps {
                triggerSpinnakerDevDeployment(
                    image: "containers.cisco.com/it_cvc_order_to_cash/rev-ops-monitoring:server-$GIT_COMMIT",
                    environments: [
                        "dev-final",
                    ]
                )
            }
        }

        stage('Build UI') {
            when {
                expression { env.BRANCH_NAME == 'develop' }
            }
            steps {
                dir("revenue-monitoring-ui") {
                    dockerBuild()
                    sh "docker tag containers.cisco.com/it_cvc_order_to_cash/rev-ops-monitoring:$GIT_COMMIT containers.cisco.com/it_cvc_order_to_cash/rev-ops-monitoring:ui-$GIT_COMMIT"
                }
            }
        }

        stage('Push UI') {
            when {
                expression { env.BRANCH_NAME == 'develop' }
            }
            steps {
                sh "pwd"
                dockerPush(
                    image: "containers.cisco.com/it_cvc_order_to_cash/rev-ops-monitoring:ui-$GIT_COMMIT"
                )
                notifyDocker()
            }
        }

        stage('Deploy UI') {
            when {
                expression { env.BRANCH_NAME == 'develop' }
            }
            steps {
                triggerSpinnakerDevDeployment(
                    image: "containers.cisco.com/it_cvc_order_to_cash/rev-ops-monitoring:ui-$GIT_COMMIT",
                    environments: [
                        "dev-final-ui",
                    ]
                )
            }
        }

        stage('SAST Security Scan') {
            steps {
                sastSecurityScan()
            }
        }
    }

    post {
        always {
            notifyBuildEnd()
        }
    }
}