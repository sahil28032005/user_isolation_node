
# initial version dockerfile for managerial purposes
# # Use the official Node.js 14 image as the base image
# FROM node:18

# # Set the working directory inside the container
# WORKDIR /workspace

# # Copy only the package.json and package-lock.json for debugging
# # COPY ./vite-project/package.json /workspace/package.json
# # COPY ./vite-project/package-lock.json /workspace/package-lock.json


# COPY vite-project/package*.json ./

# # Install dependencies
# RUN npm install
# # Expose the Vite development port (5173 by default) ac

# # Copy the entire vite-project directory, excluding what’s in .dockerignore
# COPY vite-project/ .

# EXPOSE 5173

# # Start the Vite development server
# # CMD ["tail", "-f", "/dev/null"]
# CMD ["sh", "-c", "npm run dev & tail -f /dev/null"]

# update for manual spinup of conntainers
# Use a base image with both Node.js and Java installed
# Use an official OpenJDK base image
# Use a base image with Java and build tools
# Stage 1: Build
# Use a base image with Node.js and build tools
# Use a base image with Node.js and build tools
# Use an appropriate base image for your application
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Install build dependencies and Python
RUN apt-get update && \
    apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install node-gyp globally (if needed)
RUN npm install  node-gyp

# Install dependencies
RUN npm install --no-cache

# Install node-pty with the latest tag
RUN npm install node-pty@latest

COPY . .
# Rebuild native modules
RUN npm rebuild

# Copy the rest of your application code


# Expose the port that your app runs on
EXPOSE 5000

# Start your application
CMD ["node", "server.js"]





