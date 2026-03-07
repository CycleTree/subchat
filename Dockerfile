FROM node:22-slim

RUN apt-get update && apt-get install -y git curl procps net-tools && rm -rf /var/lib/apt/lists/*

RUN npm install -g openclaw@latest

WORKDIR /root/.openclaw

# Config with token auth properly configured
RUN echo '{"gateway":{"port":8080,"bind":"lan","mode":"local","auth":{"mode":"token","token":"subchat-gateway-token-2026"},"controlUi":{"allowedOrigins":["*"]}}}' > openclaw.json

EXPOSE 8080

# Environment variable for token auth
ENV OPENCLAW_GATEWAY_TOKEN=subchat-gateway-token-2026
ENV OPENCLAW_GATEWAY_PORT=8080

CMD ["openclaw", "gateway", "run"]
