// codectl version : 1.5.2
pipeline {
    agent any

    tools {
        maven 'Maven-3.3.1'
		jdk 'JDK_11.0.3'
    }

    stages {

        stage('Build and Deploy') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'develop') {
                        sh 'printenv'
                    } else {
                        echo "Skipping build since the branch is not 'develop'"
                    }
                }
            }
        }

        stage ('Pre-Build') {
            steps {
                notifyBuildStart()
                }
        }

        stage ('Build Server') {
            steps {
                dir("revenue-monitoring-server") {
                    sh "mvn -DskipTests clean package"
                    dockerBuild()
                    sh "docker tag containers.cisco.com/it_cvc_order_to_cash/rev-ops-monitoring:$GIT_COMMIT containers.cisco.com/it_cvc_order_to_cash/rev-ops-monitoring:server-$GIT_COMMIT" 
                }

            }

        }

        stage ('Push Server') {
            steps {
			    sh "pwd"    
				dockerPush(
                    image: "containers.cisco.com/it_cvc_order_to_cash/rev-ops-monitoring:server-$GIT_COMMIT"
                )
				notifyDocker()
                
            }
        }

        stage ('Deploy Server') {
            steps {
                triggerSpinnakerDevDeployment(
                    image: "containers.cisco.com/it_cvc_order_to_cash/rev-ops-monitoring:server-$GIT_COMMIT",
                    environments: [
                        "dev-final",
                    ]
                )  
            }
        }

        stage("Build UI") {
            steps {
                dir("revenue-monitoring-ui"){
                    dockerBuild()
                    sh "docker tag containers.cisco.com/it_cvc_order_to_cash/rev-ops-monitoring:$GIT_COMMIT containers.cisco.com/it_cvc_order_to_cash/rev-ops-monitoring:ui-$GIT_COMMIT" 
                }
            }
        }

        stage ('Push UI') {
            steps {
			    sh "pwd"    
				dockerPush(
                    image: "containers.cisco.com/it_cvc_order_to_cash/rev-ops-monitoring:ui-$GIT_COMMIT"
                )
				notifyDocker()
                
            }
        }

        stage ('Deploy UI') {
            steps {
                triggerSpinnakerDevDeployment(
                    image: "containers.cisco.com/it_cvc_order_to_cash/rev-ops-monitoring:ui-$GIT_COMMIT",
                    environments: [
                        "dev-final-ui",
                    ]
                )  
            }
        }

        stage ('SAST Security Scan') {
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