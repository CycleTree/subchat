# OpenClaw Gateway on Fly.io
FROM node:18-alpine

# Install OpenClaw globally
RUN npm install -g openclaw@latest

# Create app directory
WORKDIR /app

# Copy OpenClaw configuration
COPY openclaw.fly.json /app/openclaw.json

# Expose gateway port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start OpenClaw Gateway
CMD ["openclaw", "gateway", "start", "--port", "8080", "--host", "0.0.0.0"]
