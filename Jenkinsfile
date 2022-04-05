// codectl version : 1.5.2
pipeline {
    /* In this step, you can define where your job can run.
    
     * In more advanced usages, you can have the entire build be run inside of a Docker containers
     * in order to use custom tools not natively supported by Jenkins.
    
     */
    agent any
    
    
    /* The tools this pipeline needs are defined here. The available versions are the same as those
     * available in maven or freestyle job.
     */
    
    
    tools {
        maven 'Maven-3.3.1'
		jdk 'JDK_11.0.3'
    }
    
    
    

    
    
    /*
    * Uncomment this section if you want to use specific deploy or artifact record for build
    * 'codectl get deploy' and 'codectl get artifact' gives you the list of respective IDs
    environment{
        DEPLOY_ID=""
        ARTIFACT_ID=""
    }
    */


    stages {

        /* This stage runs pre-build tasks, such as loading variables or outputing start notifications
         */
        stage ('Pre-Build') {
            steps {
                notifyBuildStart()
                }
        }/* In this stage, the code is being built/compiled, and the Docker image is being created and tagged.
         * Tests shouldn't been run in this stage, in order to speed up time to deployment.
         */   
        stage ('Build') {
            steps {
		/*
			dir("accruals-monitoring-ui")
				sh "pwd"
				// Run the docker build command and tag the image with the git commit ID
				// dockerBuild()
				sh "docker build . -f Dockerfile"
				tagDocker($DOCKER_REPO:$COMMIT_ID-ui)	
			dir("../accruals-monitoring-server")
				sh "pwd"
				sh "mvn -DskipTests clean package"
				sh "docker build -f Dockerfile --build-arg ARTIFACT_NAME=sh(returnStdout: true, script: "find target -name *.jar | tr -d '\n'")
				tagDocker($DOCKER_REPO:$COMMIT_ID-server)
				// Run the docker build command and tag the image with the git commit ID
				// dockerBuild(buildArgs: ["ARTIFACT_NAME": sh(returnStdout: true, script: "find target -name *.jar | tr -d '\n'")])
				*/

			sh "mvn -DskipTests -f ./accruals-monitoring-server/ clean package"
			
            sh "export DOCKER_REGISTRY_URL=containers.cisco.com/it_cvc_order_to_cash/rev-accruals-monitoring"

			sh "docker build -t containers.cisco.com/it_cvc_order_to_cash/rev-accruals-monitoring:ui-$GIT_COMMIT ./accruals-monitoring-ui"
			sh "docker build -t containers.cisco.com/it_cvc_order_to_cash/rev-accruals-monitoring:server-$GIT_COMMIT ./accruals-monitoring-server"

            }

        }

        

        
        /* In this stage, built images are being pushed
         */
        stage ('Push') {
            steps {
			sh "pwd"    
                
				// Authenticates with your remote Docker Repository, and pushes the value of "$DOCKER_PUSH_TAG",
				// which will exist if you used 'tagDocker' to tag your image, or set it manually. If you have done neither,
				// you can instead define your image using the 'image' parameter.
				// You can change the credentials used by using the 'authId' parameter.
				// The difference between this, and 'docker push $image', is that this handles 'docker login' for you.
				//dockerPush()
				sh "docker push containers.cisco.com/it_cvc_order_to_cash/rev-accruals-monitoring"
				// Send Webex notification about docker push event status to the Webex room defined ID in the software details, using the
				// 'CoDE:ContainerHub' bot
				notifyDocker()
                
            }
        }
        

        

        /* In this stage, we're running several different sub-stages in parallel. This speeds up job time by running many different
         * steps (that don't necessarily need to be run in sequence) at the same time, speeding up your job runtime.
         */stage ('QA/Deployment') {
            // Run these stages in parallel
            parallel {

                /* This stage simply runs your Static Security Scan. Uncomment it and include your stack name to use it.
                 */
                /*stage ('Static Security Scan') {
                    steps {
                        // Behaves exactly like the Static Security Scan step you know and love in your Maven and Freestyle jobs.
                        // scavaSecurityScan(webexTeamsId: "$WEBEX_TEAMS_ROOM_ID")
                    }

                }*/

                /* This steps runs your unit tests, and your SonarQube scan.
                 * This stage may vary heavily depending on your project language and structure.
                 */
                
                
                stage ('Test/Sonar') {
		
					steps {

						// Run your unit tests and prepare SonarQube output
						//sh "mvn -f ./accruals-monitoring-server/ org.jacoco:jacoco-maven-plugin:prepare-agent test"

						//sonarScan('Sonar')
					}


					// Make test results visible in Jenkins UI if the install step completed successfully
					post {
						success {
							junit testResults: 'target/surefire-reports/**/*.xml', allowEmptyResults: true
						}
					}
                }
                
                /* You can use these stages if you would like to deploy to different dev environments depending on the current branch.
                 * To use this, simply uncomment the blocks, and add the branch pattern (ANT style path glob). Make sure you remove the 
                 * "Deploy All" stage as well, or you will do the deployments twice.
                 */
                /*stage ('Deploy Dev') {
                    when { branch "feature/*" }
                    steps {
                        triggerSpinnakerDevDeployment(environments: ["dev"])
                    }
                }*/

                

                stage ('Deploy All') {
                    steps {
                        
                        
                        // This step will automatically include the docker image stored in env $DOCKER_PUSH_TAG, or you can specify the image
                        // parameter to this step to manually indicate the image.
                        
                        triggerSpinnakerDevDeployment(

                            // The dev environments we are deploying to
                            environments: [
                                "dev",
                            ]
                            dockerImage: "ui-$GIT_COMMIT" 
                        )  
                        
                        triggerSpinnakerDevDeployment(

                            // The dev environments we are deploying to
                            environments: [
                                "dev",
                            ]
                            dockerImage: "server-$GIT_COMMIT" 
                        )                          
                    }
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
