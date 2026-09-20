FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Create uploads dir
RUN mkdir -p uploads/covers logs

EXPOSE 5000

CMD ["node", "src/index.js"]
