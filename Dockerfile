# Dockerfile для Next.js приложения с учетом всех пакетов монорепозитория
# Учитывает media-storage (sharp), constants-edge (автогенерация), и порядок сборки

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Системные зависимости для всех пакетов монорепозитория
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    vips-dev

RUN corepack enable

# Install turbo globally
RUN pnpm add turbo --global

# Pruner stage - создание урезанной версии монорепо
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @chat-app/chat --docker

# Builder stage - установка зависимостей и сборка с учетом особенностей
FROM base AS builder
WORKDIR /app

# Build-time arguments для переменных, нужных во время Next.js build
ARG JWT_SECRET
ARG DATABASE_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG JWT_EXPIRES_IN
ARG JWT_MAX_AGE_SECONDS
ARG ENV_FILE=.env

# Устанавливаем build-time переменные окружения
ENV JWT_SECRET=${JWT_SECRET}
ENV DATABASE_URL=${DATABASE_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}
ENV JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
ENV JWT_MAX_AGE_SECONDS=${JWT_MAX_AGE_SECONDS}

# Копируем JSON файлы и lockfile для кэширования зависимостей
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Устанавливаем зависимости (включая нативные для sharp)
RUN pnpm install --frozen-lockfile

# Копируем исходный код
COPY --from=pruner /app/out/full/ .

# КРИТИЧНО: turbo prune не копирует корневые конфигурационные файлы в out/full/
# Копируем их явно из полного контекста pruner
COPY --from=pruner /app/tsconfig.base.json ./tsconfig.base.json
COPY --from=pruner /app/turbo.json ./turbo.json

# КРИТИЧНО: .env файл не попадает в pruner из-за .gitignore
# Копируем напрямую из исходного контекста (до pruner stage)
COPY ${ENV_FILE} ./.env

# КРИТИЧНО: Правильный порядок сборки для нашего монорепо
# 1. Сначала Prisma generate
RUN pnpm --filter @chat-app/db exec prisma generate

# 2. Собираем core (это автоматически создаст constants-edge через build:edge-constants)
RUN pnpm turbo run build --filter=@chat-app/core

# 3. Теперь можно собирать остальные пакеты, включая chat
RUN pnpm turbo run build --filter=@chat-app/chat

# Runner stage - финальный образ для production
FROM base AS runner
WORKDIR /app

# Устанавливаем только runtime зависимости для vips (для sharp в production)
RUN apk add --no-cache vips

# Не запускаем от root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Устанавливаем переменные окружения
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Копируем только необходимые файлы для запуска standalone приложения
COPY --from=builder --chown=nextjs:nodejs /app/apps/chat/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/chat/.next/static ./apps/chat/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/chat/public ./apps/chat/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/chat/server.js"] 