# 💬 Chat App

Современное real-time чат-приложение, созданное с использованием стека Next.js, TypeScript, Socket.IO и Prisma. Проект организован как монорепозиторий с использованием pnpm workspaces и Turbo.

## ✨ Особенности

-   **Real-time общение**: Мгновенная доставка сообщений через WebSockets (Socket.IO).
-   **Групповые и личные чаты**: Поддержка различных типов чатов.
-   **Ответы на сообщения**: Возможность цитировать и отвечать на конкретные сообщения.
-   **Медиа-вложения**: Загрузка изображений и видео через S3-совместимое хранилище (MinIO для разработки).
-   **Аутентификация**: Безопасная система входа на основе JWT.
-   **Типобезопасность**: Строгая типизация от базы данных до фронтенда с помощью Prisma и Zod.
-   **Масштабируемая архитектура**: Проект разбит на логические пакеты (`@chat-app/core`, `@chat-app/db` и т.д.).

## 🛠️ Технологический стек

-   **Фреймворк**: [Next.js](https://nextjs.org/) (App Router)
-   **Язык**: [TypeScript](https://www.typescriptlang.org/)
-   **UI**: [Material-UI (MUI)](https://mui.com/)
-   **Real-time**: [Socket.IO](https://socket.io/)
-   **База данных**: [PostgreSQL](https://www.postgresql.org/)
-   **ORM**: [Prisma](https://www.prisma.io/)
-   **Валидация**: [Zod](https://zod.dev/)
-   **Стор**: [Zustand](https://zustand-demo.pmnd.rs/)
-   **Монорепозиторий**: [pnpm Workspaces](https://pnpm.io/workspaces) + [Turborepo](https://turbo.build/repo)
-   **Контейнеризация**: [Docker](https://www.docker.com/)

## 🚀 Быстрый старт (локальная разработка)

### Требования

-   Node.js (v20+)
-   pnpm (v9+)
-   Docker и Docker Compose

### 1. Клонирование репозитория

```bash
git clone https://github.com/Stonek79/chat-app.git
cd chat-app
```

### 2. Установка зависимостей

```bash
pnpm install
```

### 3. Настройка окружения

Скопируйте пример файла с переменными окружения:

```bash
cp .env.example .env
```
*В файле `.env` уже содержатся все необходимые настройки для локального запуска.*

### 4. Запуск зависимостей в Docker

Мы используем Docker для запуска сервисов, от которых зависит приложение (база данных, кэш).

```bash
docker compose up -d postgres redis
```
> Эта команда запустит PostgreSQL и Redis в фоновом режиме.

### 5. Применение миграций и сидирование БД

```bash
pnpm --filter @chat-app/db run db:migrate
pnpm --filter @chat-app/db run db:seed
```

### 6. Запуск приложения

Запустите основное приложение и сокет-сервер в dev-режиме:

```bash
pnpm dev
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000).

---

## 🐳 Полный запуск через Docker

Для получения более подробной информации о запуске всего стека в Docker, включая S3-хранилище и Nginx, обратитесь к файлу **[DOCKER.md](./DOCKER.md)**.
