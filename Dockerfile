# ===================================
# Multi-stage Build для Production
# ===================================

# Stage 1: Builder
FROM node:20-alpine AS builder

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

# ===================================
# Stage 2: Production Runtime
# ===================================
FROM node:20-alpine AS runner

# Устанавливаем dumb-init для корректной обработки сигналов
RUN apk add --no-cache dumb-init

WORKDIR /app

# Создаем non-root пользователя
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Копируем package files
COPY backend/package*.json ./

# Устанавливаем только production зависимости
RUN npm ci --only=production && npm cache clean --force

# Копируем Prisma schema
COPY backend/prisma ./prisma/

# Генерируем Prisma Client
RUN npx prisma generate

# Копируем собранное приложение из builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Переключаемся на non-root пользователя
USER nodejs

# Экспонируем порт
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Запускаем приложение с dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
