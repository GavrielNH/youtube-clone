# BETTER SOLUTION
# Stage 1: Build stage
FROM node:18.17 AS builder

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json into the working directory
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# Bundle app source inside the docker image
COPY . .

# Build the app
RUN npm run build

# Stage 2: Production stage
FROM node:18.17

# Install ffmpeg in the container
RUN apt-get update && apt-get install -y ffmpeg

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy built app from the builder stage
COPY --from=builder /app/dist ./dist

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define the command to run your app using CMD which defines your runtime
CMD [ "npm", "run", "serve" ]



# #Use an official Node runtime as a parent image and building our own image on top of this
# FROM node:18

# # Set working directory in container to /app
# WORKDIR /app

# # Copy package.json & package-lock.json into working directory
# COPY package*.json ./

# # Install ffmpeg in container
# RUN apt-get update && apt-get install -y ffmpeg

# # Install any specified packages in package.json
# RUN npm install

# # Copy source code inside the docker image //not container?
# COPY . .

# # Make port 3000 available outside this container
# EXPOSE 3000

# # Defining the command to run your app when starting container (only one CMD allowed)
# CMD ["npm", "run", "start"]
