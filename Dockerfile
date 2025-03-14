FROM node:20-slim AS base

FROM base AS deps
RUN apt-get update && apt-get install -y \
    libgconf-2-4 \
    libxss1 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libgtk-3-0 \
    libgbm1 \
    libnss3-dev \
    ca-certificates \
    fonts-liberation \
    fonts-noto-color-emoji \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

FROM deps AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

RUN ls -la /app/dist || echo "===========dist directory not found or empty"

FROM deps AS production
WORKDIR /app

ENV PUPPETEER_CACHE_DIR=/.cache/puppeteer

ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

RUN ls -la /app/dist || echo "======== Production stage: dist directory not found"

EXPOSE 8080

CMD ["node", "dist/main.js"] 