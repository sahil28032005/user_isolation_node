#!/bin/bash

# Generate a unique identifier for the user
# USER_ID=$(uuidgen) #for linux based debian system
USER_ID=$(python -c 'import uuid; print(uuid.uuid4())')


# Create a directory for the user's workspace
mkdir -p ./workspaces/$USER_ID

# Copy the Docker Compose template and replace placeholders
cp docker-compose-template.yml ./workspaces/$USER_ID/docker-compose.yml

#copying dockerfile also
# cp Dockerfile ./workspaces/$USER_ID/Dockerfile
# Navigate to the user's workspace directory
cd ./workspaces/$USER_ID

# Start the Docker container and retrieve its ID
docker-compose up -d #starts containers in docker compose defination

CONTAINER_ID=$(docker ps -q --filter "label=com.docker.compose.service=dev-environment")

# Applying specific label to that container
# docker container update --label-add "user_id=$USER_ID" $CONTAINER_ID

# Storing container ID for backup
echo $CONTAINER_ID > ./container_id.txt

chmod +x start-user-container.sh


# Output the user's container ID and workspace directory
echo "User ID: $USER_ID"
echo "Workspace Directory: $(pwd)"
echo "Container ID: $CONTAINER_ID"
