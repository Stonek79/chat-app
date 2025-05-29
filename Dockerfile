# Dockerfile

# Этап 1: Сборка приложения
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json (или yarn.lock)
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы проекта
COPY . .

# Собираем приложение Next.js
RUN npm run build

# Этап 2: Запуск приложения
FROM node:20-alpine

WORKDIR /app

# Устанавливаем переменные окружения
ENV NODE_ENV=production
# Порт, на котором будет работать приложение Next.js
ENV PORT=3000

# Копируем собранное приложение из этапа сборки
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.mjs ./
# Если у вас есть папка node_modules с нативными зависимостями, которые не включены в .next, раскомментируйте следующую строку
# COPY --from=builder /app/node_modules ./node_modules

# Открываем порт
EXPOSE 3000

# Команда для запуска приложения
CMD ["npm", "start"] 