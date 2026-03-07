# OpenClaw Gateway on Fly.io - Debian Slim (Fixed CMD)
FROM node:22-slim

# Update package list and install required dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    build-essential \
    python3 \
    python3-dev \
    cmake \
    && rm -rf /var/lib/apt/lists/*

# Install OpenClaw globally
RUN npm install -g openclaw@latest

# Create app directory and config
WORKDIR /app
RUN echo '{"gateway": {"port": 8080, "host": "0.0.0.0"}}' > /app/openclaw.json

# Expose gateway port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start OpenClaw Gateway directly
CMD ["openclaw", "gateway", "start", "--port", "8080", "--host", "0.0.0.0", "--config", "/app/openclaw.json"]
