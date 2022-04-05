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
                sh "export DOCKER_REGISTRY_URL=containers.cisco.com/it_cvc_order_to_cash/rev-accruals-monitoring"
                notifyBuildStart()
                }
        }/* In this stage, the code is being built/compiled, and the Docker image is being created and tagged.
         * Tests shouldn't been run in this stage, in order to speed up time to deployment.
         */   
        stage ('Build Server') {
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

                dir("accruals-monitoring-server")
                sh "mvn -DskipTests -f ./accruals-monitoring-server/ clean package"
                dockerBuild()
                tagDocker("server-$GIT_COMMIT")

            }

        }

        stage("Build UI") {
            steps {
                sh "pwd"
                dir("accruals-monitoring-ui")
                dockerBuild()
                tagDocker("ui-$GIT_COMMIT")
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
				dockerPush()
				// Send Webex notification about docker push event status to the Webex room defined ID in the software details, using the
				// 'CoDE:ContainerHub' bot
				notifyDocker()
                
            }
        }
        
        stage ('Deploy All') {
            steps {
                
                
                // This step will automatically include the docker image stored in env $DOCKER_PUSH_TAG, or you can specify the image
                // parameter to this step to manually indicate the image.
            
                triggerSpinnakerDevDeployment(

                    // The dev environments we are deploying to
                    environments: [
                        "dev",
                    ]
                )  
            }
        }
    }
    post {
        always {
            notifyBuildEnd()
        }
    }
}
