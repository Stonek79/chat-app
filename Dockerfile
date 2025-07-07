# Dockerfile для Next.js приложения в монорепозитории

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

# Этап 2: Сборка пакетов и приложения
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

# Собираем Next.js приложение
RUN pnpm --filter @chat-app/chat build

# Этап 3: Production образ
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Создаем пользователя nextjs
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем необходимые файлы для Next.js standalone
COPY --from=builder /app/apps/chat/.next/standalone ./
COPY --from=builder /app/apps/chat/.next/static ./apps/chat/.next/static
COPY --from=builder /app/apps/chat/public ./apps/chat/public

# Меняем владельца файлов
USER nextjs

EXPOSE 3000

ENV HOSTNAME="0.0.0.0"

# Запускаем приложение
CMD ["node", "apps/chat/server.js"] 