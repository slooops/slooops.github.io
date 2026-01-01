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
                expression { env.BRANCH_NAME == 'develop' || env.BRANCH_NAME == 'UI2.0' || env.BRANCH_NAME == 'upgrade-angular' }
            }
            steps {
                notifyBuildStart()
            }
        }

        stage('Build Server') {
            when {
                expression { env.BRANCH_NAME == 'develop' || env.BRANCH_NAME == 'UI2.0' || env.BRANCH_NAME == 'upgrade-angular' }
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
                expression { env.BRANCH_NAME == 'develop' || env.BRANCH_NAME == 'UI2.0' || env.BRANCH_NAME == 'upgrade-angular'}
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
                expression { env.BRANCH_NAME == 'develop' || env.BRANCH_NAME == 'UI2.0' || env.BRANCH_NAME == 'upgrade-angular' }
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
                expression { env.BRANCH_NAME == 'develop' || env.BRANCH_NAME == 'UI2.0' || env.BRANCH_NAME == 'upgrade-angular' }
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
                expression { env.BRANCH_NAME == 'develop' || env.BRANCH_NAME == 'UI2.0' || env.BRANCH_NAME == 'upgrade-angular' }
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
                expression { env.BRANCH_NAME == 'develop' || env.BRANCH_NAME == 'UI2.0' || env.BRANCH_NAME == 'upgrade-angular' }
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

        stage ('Test/Sonar') {
            steps {
                dir("revenue-monitoring-server") {

                // Run your unit tests and prepare SonarQube output
                    sh "mvn org.jacoco:jacoco-maven-plugin:0.8.8:prepare-agent test org.jacoco:jacoco-maven-plugin:0.8.8:report"
                    sonarScan('Sonar')
                }
                // Run SonarQube scan for UI codebase as well
                dir("revenue-monitoring-ui") {
                    echo "Running SonarQube scan for UI project"
                    sonarScan('Sonar')
                }
            }

            post {
                success {
                    junit testResults: 'revenue-monitoring-server/target/surefire-reports/**/*.xml', allowEmptyResults: true
                }
            }
        }
    }

    post {
        always {
            notifyBuildEnd()
        }
    }
}