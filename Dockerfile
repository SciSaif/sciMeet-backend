# Stage 1: Build
FROM node:18-bullseye-slim AS builder

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies (including build dependencies)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Stage 2: Runtime
FROM node:18-bullseye-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy only the necessary files from the build stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./

# Install only the production dependencies
RUN npm install --only=production

# Expose the port the app runs on
EXPOSE 80

# Command to run the application
CMD ["npm", "start"]