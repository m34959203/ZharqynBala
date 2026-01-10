# ===================================
# Multi-stage Build для Production
# ===================================

# Stage 1: Builder
FROM node:20-alpine AS builder

# Устанавливаем OpenSSL (требуется для Prisma)
RUN apk add --no-cache openssl

# Пропускаем скачивание Chromium для Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

# Копируем package files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY backend/ ./

# Генерируем Prisma Client
RUN npx prisma generate

# Собираем приложение
RUN npm run build

# Компилируем seed для production (CommonJS модуль для Node.js)
RUN npx tsc prisma/seed.ts --outDir dist/prisma --module commonjs --target es2020 --esModuleInterop --resolveJsonModule --skipLibCheck --moduleResolution node

# ===================================
# Stage 2: Production Runtime
# ===================================
FROM node:20-alpine AS runner

# Устанавливаем dumb-init и OpenSSL
# PDF/Chromium временно отключены для оптимизации деплоя
RUN apk add --no-cache \
    dumb-init \
    openssl

# Пропускаем скачивание Chromium для Puppeteer (PDF отключен)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

# Создаем non-root пользователя
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Копируем package files
COPY backend/package*.json ./

# Устанавливаем только production зависимости (без Chromium)
RUN npm ci --omit=dev && npm cache clean --force

# Копируем Prisma schema
COPY backend/prisma ./prisma/

# Копируем скрипты
COPY backend/scripts ./scripts/

# Генерируем Prisma Client
RUN npx prisma generate

# Копируем собранное приложение из builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Копируем скомпилированный seed
COPY --from=builder --chown=nodejs:nodejs /app/dist/prisma ./dist/prisma

# Меняем владельца всех файлов на nodejs (для Prisma migrations)
RUN chown -R nodejs:nodejs /app

# Переключаемся на non-root пользователя
USER nodejs

# Экспонируем порт
EXPOSE 3001

# Запускаем приложение с dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "sh scripts/migrate-prod.sh && node dist/main.js"]
