// codectl version : 1.5.2
pipeline {
    agent any

    stages {
        stage('Pre-Build') {
            when {
                expression { env.BRANCH_NAME == 'develop' || env.BRANCH_NAME == 'UI2.0' || env.BRANCH_NAME == 'selective-deploy-self-healing'    }
            }
            steps {
                notifyBuildStart()
            }
        }

        stage('Build Server') {
            when {
                expression { env.BRANCH_NAME == 'develop' || env.BRANCH_NAME == 'UI2.0' || env.BRANCH_NAME == 'selective-deploy-self-healing'     }
            }
            steps {
                dir("revenue-monitoring-server") {
                    withDockerContainer(
                        image: 'maven:3-eclipse-temurin-25',
                        args: '--user 0:0 -e HOME=/tmp -e MAVEN_CONFIG=/tmp/.m2'
                    ) {
                        sh "mvn -Dmaven.repo.local=.m2/repository -DskipTests clean package"
                    }
                    dockerBuild()
                    sh "docker tag containers.cisco.com/it_cvc_order_to_cash/rev-ops-monitoring:$GIT_COMMIT containers.cisco.com/it_cvc_order_to_cash/rev-ops-monitoring:server-$GIT_COMMIT"
                }
            }
        }

        stage('Push Server') {
            when {
                expression { env.BRANCH_NAME == 'develop' || env.BRANCH_NAME == 'UI2.0' || env.BRANCH_NAME == 'selective-deploy-self-healing'     }
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
                expression { env.BRANCH_NAME == 'develop' || env.BRANCH_NAME == 'UI2.0' || env.BRANCH_NAME == 'selective-deploy-self-healing'    }
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
                expression { env.BRANCH_NAME == 'develop' || env.BRANCH_NAME == 'UI2.0'  || env.BRANCH_NAME == 'selective-deploy-self-healing'   }
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
                expression { env.BRANCH_NAME == 'develop' || env.BRANCH_NAME == 'UI2.0'  || env.BRANCH_NAME == 'selective-deploy-self-healing'   }
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
                expression { env.BRANCH_NAME == 'develop' || env.BRANCH_NAME == 'UI2.0' || env.BRANCH_NAME == 'selective-deploy-self-healing'     }
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

        stage('Build API Gateway') {
            when {
                expression { env.BRANCH_NAME == 'develop' || env.BRANCH_NAME == 'UI2.0' }
            }
            steps {
                dir("api-gateway") {
                    script {
                        echo "Building Python API Gateway using Docker..."
                    }
                    dockerBuild()
                    sh "docker tag containers.cisco.com/it_cvc_order_to_cash/rev-ops-monitoring:$GIT_COMMIT containers.cisco.com/it_cvc_order_to_cash/rev-ops-monitoring:api-gateway-$GIT_COMMIT"
                }
            }
        }

        stage('Push API Gateway') {
            when {
                expression { env.BRANCH_NAME == 'develop' || env.BRANCH_NAME == 'UI2.0' }
            }
            steps {
                dockerPush(
                    image: "containers.cisco.com/it_cvc_order_to_cash/rev-ops-monitoring:api-gateway-$GIT_COMMIT"
                )
                notifyDocker()
            }
        }

        stage('Deploy API Gateway') {
            when {
                expression { env.BRANCH_NAME == 'develop' || env.BRANCH_NAME == 'UI2.0' }
            }
            steps {
                triggerSpinnakerDevDeployment(
                    image: "containers.cisco.com/it_cvc_order_to_cash/rev-ops-monitoring:api-gateway-$GIT_COMMIT",
                    environments: [
                        "dev-subscription-python",
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
                    script {
                        // The container runs as root, so target/ comes back root-owned.
                        // sonarScan runs on the agent and must be able to write target/sonar.
                        def agentUid = sh(script: 'id -u', returnStdout: true).trim()
                        def agentGid = sh(script: 'id -g', returnStdout: true).trim()
                        withDockerContainer(
                            image: 'maven:3-eclipse-temurin-25',
                            args: '--user 0:0 -e HOME=/tmp -e MAVEN_CONFIG=/tmp/.m2'
                        ) {
                            sh "mvn -Dmaven.repo.local=.m2/repository test"
                            sh "chown -R ${agentUid}:${agentGid} target .m2"
                        }
                    }
                    sonarScan('Sonar')
                }
                // TODO: restore UI analysis once revenue-monitoring-ui has its own
                // Sonar project, a test run producing lcov, and a scanner that
                // doesn't require a POM. sonarScan() invokes sonar-maven-plugin.
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