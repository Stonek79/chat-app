# Dockerfile

# Этап 1: Сборка приложения
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и lock-файлы (package-lock.json, yarn.lock, или pnpm-lock.yaml)
# Копируем все варианты, чтобы Dockerfile был более универсальным
COPY package.json ./
COPY package-lock.json* ./
# COPY yarn.lock ./
# COPY pnpm-lock.yaml ./

# Устанавливаем ВСЕ зависимости, так как они могут быть нужны для сборки (например, typescript, @types/*)
# Используем npm ci для более быстрых и надежных сборок, если есть package-lock.json
RUN if [ -f package-lock.json ]; then npm ci; \
    # elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    # elif [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
    else npm install; fi

# Копируем остальные файлы проекта
# Убедитесь, что .dockerignore настроен правильно, чтобы не копировать лишнее (например, .git, node_modules локальные)
COPY . .

# Собираем приложение Next.js
# Переменные окружения времени сборки (если нужны, например, для NEXT_PUBLIC_*)
# Пример: 
# ARG NEXT_PUBLIC_API_URL
# ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build

# Этап 2: Запуск приложения
FROM node:20-alpine AS runner 
# Даем имя финальному этапу для ясности

WORKDIR /app

# Устанавливаем переменные окружения
ENV NODE_ENV=production
# Порт, на котором будет работать приложение Next.js (будет переопределен из docker-compose, если нужно)
ENV PORT=3000 
# NEXT_PUBLIC_SOCKET_URL и NEXT_PUBLIC_SOCKET_NAMESPACE будут переданы через docker-compose

# Копируем package.json и lock-файл для установки ТОЛЬКО production-зависимостей
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* ./
# COPY --from=builder /app/yarn.lock ./
# COPY --from=builder /app/pnpm-lock.yaml ./

# Устанавливаем только production-зависимости
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; \
    # elif [ -f yarn.lock ]; then yarn install --production --frozen-lockfile; \
    # elif [ -f pnpm-lock.yaml ]; then pnpm install --prod --frozen-lockfile; \
    else npm install --omit=dev; fi

# Копируем собранное приложение из этапа сборки
# Если вы НЕ используете output: 'standalone' в next.config.mjs:
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./
# node_modules уже будут установлены выше только для production

# Если вы ИСПОЛЬЗУЕТЕ output: 'standalone' в next.config.mjs, 
# то секция копирования выше (для .next, public, next.config.mjs) должна быть закомментирована,
# а эта секция раскомментирована:
# COPY --from=builder /app/.next/standalone ./ 
# COPY --from=builder /app/.next/static ./.next/static # Копируем статические ассеты для standalone
# COPY --from=builder /app/public ./public # Public папка также может быть нужна

# Открываем порт (тот же, что и ENV PORT)
EXPOSE 3000

# Команда для запуска приложения
# Если output: 'standalone', команда может быть CMD ["node", "server.js"]
CMD ["npm", "start"] 