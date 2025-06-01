# Dockerfile для выделенного Socket.IO сервера

# Этап 1: Установка зависимостей и сборка TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package.json и package-lock.json (или yarn.lock, pnpm-lock.yaml)
COPY package*.json ./
# COPY yarn.lock ./
# COPY pnpm-lock.yaml ./

# Устанавливаем ВСЕ зависимости, включая devDependencies, так как они нужны для сборки (например, typescript)
RUN npm install 
# Если используете yarn: yarn install --production=false
# Если используете pnpm: pnpm install --prod=false

# Копируем остальной исходный код
COPY . .

# Собираем TypeScript в JavaScript
RUN npm run build

# Этап 2: Создание production-образа
FROM node:20-alpine

WORKDIR /app

# Копируем package.json и lock-файл для установки только production-зависимостей
COPY package*.json ./
# COPY yarn.lock ./
# COPY pnpm-lock.yaml ./

# Устанавливаем только production-зависимости
RUN npm install --omit=dev
# Если используете yarn: yarn install --production
# Если используете pnpm: pnpm install --prod

# Копируем собранный код из этапа builder
COPY --from=builder /app/dist ./dist

# Переменные окружения (могут быть переопределены в docker-compose.yml)
ENV NODE_ENV=production
ENV SOCKET_PORT=3001
ENV SOCKET_CORS_ORIGIN=http://localhost:3000
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379
# ENV REDIS_PASSWORD=

# Открываем порт, на котором будет работать Socket.IO сервер
EXPOSE ${SOCKET_PORT}

# Команда для запуска приложения
CMD ["node", "dist/server.js"] 