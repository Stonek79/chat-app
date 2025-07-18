# Dockerfile для Next.js приложения с учетом всех пакетов монорепозитория
# Учитывает media-storage (sharp), constants-edge (автогенерация), и порядок сборки

FROM node:20-slim AS base

# Устанавливаем pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

# Install turbo globally
RUN pnpm add turbo --global

# Устанавливаем OpenSSL, т.к. Prisma требует его для работы с PostgreSQL.
# Без этого могут быть проблемы с подключением к БД.
RUN apt-get update && apt-get install -y openssl

# Pruner stage - создание урезанной версии монорепо
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @chat-app/chat --docker

# Builder stage - установка зависимостей и сборка с учетом особенностей
FROM base AS builder
WORKDIR /app

# Принимаем DATABASE_URL как аргумент сборки
ARG DATABASE_URL
# Устанавливаем его как переменную окружения для этого stage
ENV DATABASE_URL=${DATABASE_URL}

# Build-time arguments для переменных, нужных во время Next.js build
ARG JWT_SECRET
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG JWT_EXPIRES_IN
ARG JWT_MAX_AGE_SECONDS
ARG ENV_FILE=.env
ARG UPLOADS_PATH

# Устанавливаем build-time переменные окружения
ENV JWT_SECRET=${JWT_SECRET}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}
ENV JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
ENV JWT_MAX_AGE_SECONDS=${JWT_MAX_AGE_SECONDS}
ENV UPLOADS_PATH=${UPLOADS_PATH}

# --- ОПТИМИЗАЦИЯ СБОРКИ: ШАГ 1 ---
# Копируем только то, что нужно для установки зависимостей.
# Этот слой будет кешироваться, пока pnpm-lock.yaml не изменится.
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Устанавливаем зависимости. Этот долгий шаг будет закеширован.
RUN pnpm install --frozen-lockfile

# --- ОПТИМИЗАЦИЯ СБОРКИ: ШАГ 2 ---
# Теперь, когда зависимости установлены и закешированы, копируем остальной код.
# Изменения в коде будут инвалидировать кеш только с этого момента, а не с pnpm install.
COPY --from=pruner /app/out/full/ .

# КРИТИЧНО: turbo prune не копирует корневые конфигурационные файлы в out/full/
# Копируем их явно из полного контекста pruner.
COPY --from=pruner /app/tsconfig.base.json ./tsconfig.base.json
COPY --from=pruner /app/turbo.json ./turbo.json

# КРИТИЧНО: .env файл не попадает в pruner из-за .gitignore
# Копируем .env файл, если он предоставлен.
COPY ${ENV_FILE} ./.env

# --- ОПТИМИЗАЦИЯ СБОРКИ: ШАГ 3 ---
# Запускаем сборку. Порядок важен для кеширования turbo.
# 1. Сначала Prisma generate. Этот шаг зависит только от prisma/schema.prisma
RUN pnpm --filter @chat-app/db exec prisma generate

# 2. Собираем все зависимости проекта (кроме самого chat-app)
# Это закешируется, если вы не трогаете код в packages/*
RUN pnpm turbo run build --filter="!@chat-app/chat"

# 3. Наконец, собираем основное приложение.
# Только изменения в apps/chat будут приводить к пересборке этого слоя.
RUN pnpm turbo run build --filter=@chat-app/chat

# Runner stage - финальный образ для production
FROM base AS runner
WORKDIR /app

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