FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Start command (Run migrations then start)
CMD ["sh", "-c", "npm run migrate && node dist/src/index.js"]
