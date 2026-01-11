# Dockerfile для Socket.IO сервера с учетом всех пакетов монорепозитория
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
RUN turbo prune @chat-app/socket-server --docker

# Builder stage - установка зависимостей и сборка с учетом особенностей
FROM base AS builder
WORKDIR /app

# Build-time argument для файла окружения
ARG ENV_FILE=.env

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

# 3. Теперь можно собирать socket-server и его зависимости
RUN pnpm turbo run build --filter=@chat-app/socket-server

# Runner stage - минимальный production образ
FROM base AS runner
WORKDIR /app

# Устанавливаем только runtime зависимости для vips (если нужно в runtime)
RUN apk add --no-cache vips

# Создаем пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 socketuser

# Копируем уже установленные node_modules из builder (включая workspace пакеты)
COPY --from=builder /app/node_modules ./node_modules

# Копируем собранные пакеты workspace (нужны для резолва модулей)
COPY --from=builder /app/packages ./packages

# Копируем собранный JavaScript код с сохранением структуры
COPY --from=builder /app/apps/socket-server/dist ./apps/socket-server/dist

# Меняем владельца файлов и переключаемся на безопасного пользователя
RUN chown -R socketuser:nodejs /app
USER socketuser

# Переменные окружения
ENV NODE_ENV=production
ENV PORT=3003

EXPOSE 3003

# Запускаем скомпилированный сервер
CMD ["node", "apps/socket-server/dist/server.js"] 