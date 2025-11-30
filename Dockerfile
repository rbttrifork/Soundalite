FROM node:20

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Expose port (both services may need this)
EXPOSE 3000

# Use wrapper script - SERVICE_TYPE env var determines what runs
# Defaults to 'bot' if not set
CMD ["node", "start.js"]

