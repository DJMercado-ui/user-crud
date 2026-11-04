
# Use Node.js 22 with Alpine Linux
FROM node:22-alpine

# Set the working directory
WORKDIR /app

# Install the Ionic CLI
RUN npm install -g @ionic/cli

# Copy package files
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the Ionic development server port
EXPOSE 4200

# Start the Ionic application
CMD ["ionic", "serve", "--host=0.0.0.0", "--port=4200", "--no-open"]
