// Define variable
def DOCKER_REPO="registry.git.famtechvn.net/nodejs/media"
def DOCKER_IMAGE_NAME="media"
def LOG_PATH="/home/famtech/data/media-social"
def ENV="native"
def GIT_COMMIT_DESC = ''

// Define notification build function
def notifyBuild(String buildStatus = 'STARTED', String GIT_COMMIT_DESC) {
    def colorCode = '#FF0000'
    def subject = "${buildStatus}: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'\n"
    def summary = "<@dovietanh.th>${subject} ${GIT_COMMIT_DESC == '' ? '' : GIT_COMMIT_DESC} (${env.BUILD_URL})"
    // Override default values based on build status
    if (buildStatus == 'STARTED') {
        //color = 'YELLOW'
        colorCode = '#FFFF00'
    } else if (buildStatus == 'SUCCESSFUL') {
        //color = 'GREEN'
        colorCode = '#00FF00'
    } else {
        //color = 'RED'
        colorCode = '#FF0000'
    }
    // Send notifications
    slackSend (color: colorCode, message: summary)
}

// Run pipeline
pipeline {
    agent any
    environment {
        DOCKER_REGISTRY = credentials('backend-docker-registry-id')
        PERSONAL_TOKEN = credentials('anhdv-gitlab-access-token')
    }
    stages {
    	stage ('Send start notification') {
            steps {
                script {
                    GIT_COMMIT_DESC = sh(script: 'git log --format=oneline -n 1', returnStdout: true).trim()
                }
                notifyBuild('STARTED', GIT_COMMIT_DESC)
            }
        }
        stage('Docker build staging') {
            when {
                anyOf {
                    environment name: 'GIT_BRANCH', value: 'develop';
                    environment name: 'GIT_BRANCH', value: 'origin/develop'
                }
            }
            steps {
                echo 'Docker build'
                sh "docker build -t ${DOCKER_REPO} ."
                sh "docker tag ${DOCKER_REPO} ${DOCKER_REPO}:stb_${env.GIT_COMMIT}"
                echo 'Push to docker registry'
                sh "docker login -u server-api-personal-token -p ${PERSONAL_TOKEN} ${DOCKER_REGISTRY}"
				sh "docker push ${DOCKER_REPO}:stb_${env.GIT_COMMIT}"
                echo "GIT_BRANCH ${env.GIT_BRANCH}"
                echo "BUILD_NUMBER ${env.BUILD_NUMBER}"
                echo "BUILD_ID ${env.BUILD_ID}"
                echo "BUILD_DISPLAY_NAME ${env.BUILD_DISPLAY_NAME}"
                echo "JOB_NAME ${env.JOB_NAME}"
                echo "JOB_BASE_NAME ${env.JOB_BASE_NAME}"
                echo "BUILD_TAG ${env.BUILD_TAG}"
                echo "EXECUTOR_NUMBER ${env.EXECUTOR_NUMBER}"
                echo "NODE_NAME ${env.NODE_NAME}"
                echo "NODE_LABELS ${env.NODE_LABELS}"
                echo "WORKSPACE ${env.WORKSPACE}"
                echo "WORKSPACE_TMP ${env.WORKSPACE_TMP}"
                echo "JENKINS_HOME ${env.JENKINS_HOME}"
                echo "JENKINS_URL ${env.JENKINS_URL}"
                echo "BUILD_URL ${env.BUILD_URL}"
                echo "JOB_URL ${env.JOB_URL}"
                echo "GIT_COMMIT ${env.GIT_COMMIT}"
                echo "GIT_PREVIOUS_COMMIT ${env.GIT_PREVIOUS_COMMIT}"
                echo "GIT_PREVIOUS_SUCCESSFUL_COMMIT ${env.GIT_PREVIOUS_SUCCESSFUL_COMMIT}"
                echo "GIT_BRANCH ${env.GIT_BRANCH}"
                echo "GIT_LOCAL_BRANCH ${env.GIT_LOCAL_BRANCH}"
                echo "GIT_CHECKOUT_DIR ${env.GIT_CHECKOUT_DIR}"
                echo "GIT_URL ${env.GIT_URL}"
                echo "GIT_COMMITTER_NAME ${env.GIT_COMMITTER_NAME}"
                echo "GIT_AUTHOR_NAME ${env.GIT_AUTHOR_NAME}"
                echo "GIT_COMMITTER_EMAIL ${env.GIT_COMMITTER_EMAIL}"
                echo "GIT_AUTHOR_EMAIL ${env.GIT_AUTHOR_EMAIL}"
                echo "SVN_REVISION ${env.SVN_REVISION}"
                echo "SVN_URL ${env.SVN_URL}"
            }
        }
        stage('Docker build production') {
            when {
                anyOf {
                    environment name: 'GIT_BRANCH', value: 'master';
                    environment name: 'GIT_BRANCH', value: 'origin/master'
                }
            }
            steps {
                echo 'Docker build'
                sh "docker build -t ${DOCKER_REPO} ."
                sh "docker tag ${DOCKER_REPO} ${DOCKER_REPO}:lts_${env.GIT_COMMIT}"
                echo 'Push to docker registry'
                sh "docker login -u server-api-personal-token -p ${PERSONAL_TOKEN} ${DOCKER_REGISTRY}"
				sh "docker push ${DOCKER_REPO}:lts_${env.GIT_COMMIT}"
                echo "GIT_BRANCH ${env.GIT_BRANCH}"
            }
        }
        stage('Deploy to staging') {
            when {
                anyOf {
                    environment name: 'GIT_BRANCH', value: 'develop';
                    environment name: 'GIT_BRANCH', value: 'origin/develop'
                }
            }
            steps {
                echo 'Deploy to dev environment'
                sh "/usr/local/bin/kubectl config use-context dev"
                sh "/usr/local/bin/kubectl set image deployments/media-social media=${DOCKER_REPO}:stb_${env.GIT_COMMIT}"
            }
        }
        stage('Deploy to production') {
            when {
                anyOf {
                    environment name: 'GIT_BRANCH', value: 'master';
                    environment name: 'GIT_BRANCH', value: 'origin/master'
                }
            }
            steps {
                echo 'Deploy to production'
                sh "/usr/local/bin/kubectl config use-context prod"
                sh "/usr/local/bin/kubectl set image deployments/media-social media=${DOCKER_REPO}:lts_${env.GIT_COMMIT}"
            }
        }
    }
    post {
        success {
            notifyBuild('SUCCESSFUL', GIT_COMMIT_DESC)
        }
        failure {
            notifyBuild('FAILED', GIT_COMMIT_DESC)
        }
    }
}