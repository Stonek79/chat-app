# Dockerfile для Socket.IO сервера в монорепозитории

# Этап 1: Установка зависимостей
FROM node:20-alpine AS deps
WORKDIR /app

# Копируем package.json файлы для установки зависимостей
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/
COPY apps/*/package.json ./apps/

# Устанавливаем pnpm и зависимости
RUN npm install -g pnpm@latest
RUN pnpm install --frozen-lockfile

# Этап 2: Сборка пакетов и socket-server
FROM node:20-alpine AS builder
WORKDIR /app

# Копируем зависимости из предыдущего этапа
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Копируем весь исходный код
COPY . .

# Устанавливаем pnpm
RUN npm install -g pnpm@latest

# Собираем все пакеты
RUN pnpm build:packages

# Собираем socket-server
RUN pnpm --filter @chat-app/socket-server build

# Этап 3: Production образ
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV SOCKET_PORT=3001

# Создаем пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 socketuser

# Копируем package.json для production зависимостей
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Копируем собранные пакеты
COPY --from=builder /app/packages/*/dist ./packages/
COPY --from=builder /app/packages/*/package.json ./packages/

# Копируем собранный socket-server
COPY --from=builder /app/apps/socket-server/dist ./apps/socket-server/dist
COPY --from=builder /app/apps/socket-server/package.json ./apps/socket-server/

# Устанавливаем pnpm и только production зависимости
RUN npm install -g pnpm@latest
RUN pnpm install --prod --frozen-lockfile

# Меняем владельца файлов
USER socketuser

EXPOSE 3001

# Запускаем socket-server
CMD ["node", "apps/socket-server/dist/server.js"] 