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
    wget \
    gnupg \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

FROM deps AS build
WORKDIR /app

ARG PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=${PUPPETEER_SKIP_CHROMIUM_DOWNLOAD}

COPY package*.json ./
RUN npm ci

COPY . .

# TypeScript 컴파일 실행 (마이그레이션 포함)
RUN npm run build

# 마이그레이션 파일 존재 확인
RUN ls -la /app/dist/migrations || echo "경고: 마이그레이션 디렉토리를 찾을 수 없습니다. tsconfig.json 확인 필요"
RUN find /app/dist/migrations -name "*.js" | grep . || echo "경고: 컴파일된 마이그레이션 파일을 찾을 수 없습니다"

FROM deps AS production
WORKDIR /app

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV PUPPETEER_CACHE_DIR=/.cache/puppeteer
ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

EXPOSE 8080

CMD ["node", "dist/main.js"] 