# Project.md: Чат-приложение на Next.js

## Цели проекта

Создать современное PWA‑чат‑приложение на базе Next.js v15 и React v19 с использованием Socket.IO, Prisma и Redis. Приложение должно включать групповые и приватные чаты, end‑to‑end шифрование, гибкую систему ролей, админ‑панель и полностью использовать возможности App Router, Server и Client Components Next.js 13+.

## Ключевые результаты (Ожидаемые)

*   **Каркас проекта**: Next.js App Directory, TypeScript, PWA (Next-PWA), Docker + Redis + PostgreSQL
*   **Типизация**: Строгая типизация, без `any`. Общие типы в папке /src/types. 
*   **Импорты модулей**: Модули импортируются из `index.ts`
*   **Данные**: Мультифайловая схема Prisma (User, Chat, ChatParticipant, Message, SessionMessage).
*   **Auth**: Регистрация, подтверждение email (NextAuth/Mailtrap), JWT/cookie (14 дней), роли user/admin.
*   **Чаты**: Socket.IO namespace "/chat", Redis pub/sub.
*   **Сообщения**: E2E‑шифрование (Web Crypto API), загрузка файлов, ответы, редактирование/Soft Delete.
*   **UI/UX**: MUI, адаптивность, Drawer, BottomNavigation, индикаторы, Installation prompt.
*   **Админ‑панель**: App Router (/admin), Server Components, управление.
*   **Качество**: ESLint, Prettier, Husky, TSDoc, Jest, Playwright, GitHub Actions, мониторинг (Prometheus/Grafana), Sentry.
*   **Документация**: README.md, project.md, OpenAPI для API, документирование кода.

## Структура каталогов (Планируемая)

```
/chat-app
├── project.md              # Трекер с целями, структурой и статусами
├── Dockerfile              # Dockerfile для Next.js приложения
├── docker-compose.yml      # nextjs, socket-server, postgres, redis
├── next.config.mjs         # с плагином next-pwa (или .js)
├── tsconfig.json
├── package.json
├── .env.example            # Пример переменных окружения
├── .env                    # Переменные окружения (локально, не в git)
├── .gitignore
├── README.md
├── prisma/
│   ├── schema/
│   │   ├── User.prisma
│   │   ├── Chat.prisma
│   │   ├── ChatParticipant.prisma
│   │   ├── Message.prisma
│   │   └── SessionMessage.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   ├── icons/              # PWA-иконки (например, icon-192x192.png, icon-512x512.png)
│   └── manifest.json       # Манифест PWA
│   #└── sw.js               # Service Worker (если кастомный, иначе генерируется next-pwa)
├── socket-server/          # <--- НОВАЯ ДИРЕКТОРИЯ ДЛЯ ВЫДЕЛЕННОГО СЕРВЕРА SOCKET.IO
│   ├── Dockerfile          # Dockerfile для Socket.IO сервера
│   ├── package.json        # package.json для Socket.IO сервера
│   ├── tsconfig.json       # tsconfig.json для Socket.IO сервера
│   └── src/
│       └── server.ts       # Основной файл Socket.IO сервера
│       └── middlewares/    # Middleware для Socket.IO (например, authMiddleware.ts)
│       └── namespaces/     # Логика неймспейсов Socket.IO (например, chatNamespace.ts)
│       └── ...             # Другие модули сервера
└── src/
    ├── app/                # App Router
    │   ├── layout.tsx      # Общий layout, навигация
    │   ├── page.tsx        # Главная страница со списком чатов
    │   ├── chat/[chatId]/  # Динамический сегмент для чатов
    │   │   ├── layout      # Общий layout чатов (включает сайдбар)
    │   │   └── page.tsx    # UI чата (Server + Client Components)
    │   ├── admin/          # Админ-панель
    │   │   ├── layout.tsx  # Общий layout админки
    |   |   └── ...         # Другие страницы админки
    │   ├── login/          # Страница входа
    │   │   └── page.tsx
    │   │   register/       # Страница регистрации
    |   |   └── page.tsx
    │   └── ...             # Другие страницы
    │   └── api/            # Глобальные API routes
    │       ├── auth/       # Маршруты аутентификации
    │       │   ├── register/route.ts
    │       │   ├── confirm/route.ts
    │       │   ├── login/route.ts
    │       │   └── logout/route.ts
    │       ├── chats/[chatId]/      # API для управления чатами с динамическим сегментом
    │       │   ├── create/route.ts
    |       |   └── route.ts    # API маршруты Socket handshake (или другие API для чата)
    │       └── ...         # Другие API
    ├── components/         # Общие Client Components (UI-библиотека MUI и кастомные)
    │   ├── ChatList.tsx
    │   ├── ChatListItem.tsx
    │   ├── MessageBubble.tsx
    │   └── ChatSettingsModal.tsx
    ├── lib/                # Библиотеки и утилиты
    │   ├── prisma.ts       # Инициализация Prisma Client
    │   ├── redis.ts        # Инициализация Redis Client + pub/sub (может использоваться и Next.js, и socket-server)
    │   ├── crypto.ts       # Утилиты для E2E-шифрования (Web Crypto API)
    │   └── socket.ts       # <--- КЛИЕНТСКАЯ ОБЕРТКА ДЛЯ SOCKET.IO
    ├── hooks/              # Кастомные React Hooks (например, useChat, useAuth)
    ├── store/              # Управление состоянием клиента (например, Zustand)
    ├── utils/              # Вспомогательные утилиты (например,        Zod-валидация, date-fns, helpers)
    └── types/              # Все общие типы (например User, Message, Chat и т.п.)
```
<!-- Итоговый набор промптов для IDE Cursor

1. Инициализация проекта и трекинг

Создай каркас проекта в IDE Cursor с использованием Next.js v15 App Directory и TypeScript. Настрой next.config.js с плагином next-pwa, добавь manifest.json и service worker. Создай Dockerfile и docker-compose.yml для сервисов Next.js, PostgreSQL и Redis. Добавь ESLint, Prettier и Husky pre-commit хуки. Сгенерируй project.md с описанием целей, структуры каталогов и «Этап 1: Инициализация» (статус: выполнено).

2. Prisma-схема и моделирование данных

Создай мультифайловую схему Prisma в папке prisma/schema: User.prisma, Chat.prisma, ChatParticipant.prisma, Message.prisma, SessionMessage.prisma. Описать поля, типы и связи (1‑to‑many, many‑to‑many). Укажи пример использования каждой модели (fetchChatsByUser, fetchChatHistory, startEphemeralChat). Настрой redisClient для pub/sub. Обнови project.md «Этап 2: Моделирование данных».

3. Миграции и seed-данные

Запусти миграции Prisma и создай seed.ts для заполнения тестовыми данными: 3 пользователя, 2 группы чатов, 1 приватный чат, несколько сообщений. Обнови project.md «Этап 2.1: Миграции и сиды» как выполненный.

4. Аутентификация и авторизация

Реализуй API Route Handlers в app/api/auth: register, confirm, login, logout. Используй NextAuth или собственные JWT/cookie решения. Интегрируй Mailtrap для подтверждения email, добавь роли user/admin и TTL сессии 14 дней. Создай Server Component для admin/dashboard с approve/deny. Обнови project.md «Этап 3: Auth».

5. Socket.IO и чаты

Настрой Socket.IO сервер в src/sockets с namespace "/chat", middleware авторизации JWT. Реализуй клиентский wrapper в Client Component ChatWindow. События: joinChat, leaveChat, sendMessage, editMessage, deleteMessage. Используй Redis pub/sub для масштабирования. Добавь Route Handler app/api/chats/create. Обнови project.md «Этап 4: Чаты».

6. E2E‑шифрование и файлообмен

В lib/crypto.ts реализуй генерацию ключей (Web Crypto API), шифрование/дешифрование сообщений. В компоненте FileUploader добавь загрузку изображений до 25 МБ и файлов до 100 МБ с валидацией через Zod. Обнови project.md «Этап 5: Безопасность и файлы».

7. UI‑компоненты и адаптивность

Создай Client Components на MUI: ChatList, ChatListItem, MessageBubble, ChatSettingsModal. Используй Drawer для десктопа и BottomNavigation для мобильных. Настрой Installation Prompt для PWA и offline-кеш сервисом next-pwa. Обнови project.md «Этап 6: UI». 

8. Админ‑панель и управление

В папке app/admin создай Server Component dashboard page.tsx для отображения registrationRequests, chats, messages с поддержкой фильтров. Реализуй API Route Handlers для approve/deny user, softUndeleteChat, purgeMessage. Защитить маршруты middleware role=admin. Обнови project.md «Этап 7: Админ‑панель». 

9. Документация, тестирование и DevOps

Сгенерируй README.md с инструкциями (App Directory, PWA, Docker, миграции). Добавь TSDoc, настрой Jest для unit-тестов и Playwright для e2e. Настрой GitHub Actions CI/CD, мониторинг (Prometheus/Grafana), логирование (Sentry), rate limiting через Redis, защиту CSRF и валидацию через Zod. Обнови project.md «Этап 8: Завершение». 

Примечание: приложение должно максимально использовать App Router features: Server Components для data fetching и Route Handlers для API.
 -->

## Этапы проекта и задачи

### Этап 1: Инициализация и базовая настройка

*   **Статус:** Выполнено
*   **Задачи:**
    *   [x] Инициализировать проект Next.js v15 с TypeScript.
    *   [x] Настроить `next.config.mjs` с плагином `next-pwa`.
    *   [x] Добавить `public/manifest.json` и предусмотреть место для иконок PWA.
    *   [x] Создать `Dockerfile` для сборки и запуска приложения.
    *   [x] Создать `docker-compose.yml` для сервисов Next.js, PostgreSQL, Redis (будет дополнено для socket-server).
    *   [x] Подготовить `.env.example` для переменных окружения.
    *   [x] Настроить ESLint и Prettier.
    *   [x] Настроить Husky pre-commit хуки для автоматической проверки и форматирования кода.
    *   [x] Создать `project.md` (этот файл) для трекинга.
    *   [x] Создать базовую структуру каталогов и файлов (пустые файлы-заглушки).

### Этап 2: Prisma-схема и моделирование данных (Подробно)

**Цель этапа:** Определить полную схему данных в Prisma, включая все необходимые модели, поля и связи для поддержки функционала чата, пользователей, аутентификации и E2E шифрования. Сгенерировать Prisma Client.

**Задачи:**

1.  **Доработка моделей Prisma (`prisma/`):**
    *   [x] `User.prisma`: Обновлен связями, подробными комментариями.
    *   [x] `Chat.prisma`: Обновлен связями, подробными комментариями.
    *   [x] `ChatParticipant.prisma`: Обновлен связями (User, Chat), полями `role`, `encryptedSessionKey`, `lastReadMessageId`.
    *   [x] `Message.prisma`: Обновлен связями (User, Chat), полями `contentType`, `status`, `deletedAt`, `replyToMessageId`, `forwardedFromMessageId`.
    *   [x] `SessionMessage.prisma` (для WebRTC сигнализации и обмена временными ключами): Обновлены поля `senderId`, `receiverId`, `messageType`, `payload`.
2.  **[x] Настройка Multi-file Prisma Schema:**
    *   [x] Главный файл `prisma/schema.prisma` содержит только `datasource` и `generator`.
    *   [x] Файлы моделей (`User.prisma`, `Chat.prisma` и т.д.) размещены непосредственно в директории `prisma/`.
    *   [x] Конфигурация `package.json` (`"prisma": { "schema": "./prisma" }`) указывает на директорию `prisma`.
3.  **[x] Проверка связей и генерация клиента:**
    *   [x] Все связи между моделями проверены и корректно настроены для двусторонних отношений (где это необходимо) и правил `onDelete`.
    *   [x] Установлены зависимости `prisma` и `@prisma/client`.
    *   [x] Выполнена команда `prisma generate` (или `npm run prisma:generate`) для успешной генерации Prisma Client.
    *   [x] Настроен файл `.env` с корректной переменной `DATABASE_URL` для подключения к PostgreSQL в Docker.
4.  **[x] Создание и применение миграций:**
    *   [x] Создана и применена начальная миграция базы данных (`prisma migrate dev`).
5.  **[x] Настройка Redis Client (Pub/Sub):**
    *   [x] Установлен пакет `ioredis`.
    *   [x] Настроен `redisClient` (`src/lib/redis.ts`) для подключения к Redis (используя `REDIS_URL` из `.env`).
    *   [ ] (Пересмотрено в Этапе 4) Интегрировать с Socket.IO адаптером (`@socket.io/redis-adapter`).
6.  **Обновление `project.md`:**
    *   [x] Отметить задачи этого этапа как выполненные.

### Этап 2.1: Миграции и Seed-данные (Опционально, но рекомендуется)

*   **Статус:** Выполнено
*   **Задачи:**
    *   [x] Создана и применена начальная миграция базы данных (`prisma migrate dev`).
    *   [x] Настроить `prisma/seed.ts` для начального заполнения тестовыми данными (например, 3 пользователя, несколько чатов, сообщения).
    *   [x] Выполнить `prisma db seed` (если seed.ts настроен).

### Этап 3: Аутентификация и Авторизация

*   **Статус:** В процессе (значительный прогресс)
*   **Задачи:**
    *   [~] Реализовать регистрацию пользователей (API `/register` создан, клиентский провайдер и хук `useAuth` реализованы, базовая логика есть, но без реальной отправки email для подтверждения).
    *   [ ] Настроить подтверждение по email (API `/confirm/[token]` создан; сама отправка email и интеграция с сервисом типа Mailtrap - впереди).
    *   [~] Реализовать вход/выход пользователей (JWT/cookie) (API `/login` и `/logout` созданы, JWT генерируется и устанавливается в HttpOnly cookie, logout очищает cookie; клиентский провайдер и хук `useAuth` для управления состоянием реализованы. JWT секрет используется в Socket.IO middleware).
    *   [x] Определить и внедрить систему ролей (user/admin) (поле `role` в `User.prisma`, используется при создании JWT и в Socket.IO middleware).
    *   [x] Создать API эндпоинты для аутентификации в `src/app/api/auth/` (`register`, `confirm`, `login`, `logout`).
    *   [x] Создать хук `useAuth` для удобной работы с состоянием аутентификации на клиенте.
    *   [x] Установить TTL сессии (JWT и cookie) на 14 дней.
    *   [~] Создать Server Component-заглушку для `admin/dashboard` (без логики approve/deny).

### Этап 4: Базовая функциональность чатов (Миграция на выделенный Socket.IO сервер, Redis)

*   **Статус:** В процессе
*   **Задачи (после миграции на выделенный сервер):**
    *   **Подготовка и миграция существующей логики:**
        *   [ ] **Удалить** старую реализацию Socket.IO сервера (`src/sockets/server/`, `src/sockets/client/` (если применимо), и части `src/sockets/index.ts`).
        *   [x] **Создать структуру** для выделенного Socket.IO сервера в `socket-server/`.
        *   [x] **Инициализировать Node.js/TypeScript проект** в `socket-server/` (`package.json`, `tsconfig.json`).
    *   **Реализация выделенного Socket.IO сервера (`socket-server/`):**
        *   [x] Написать базовую логику Socket.IO сервера в `socket-server/src/server.ts`.
        *   [x] Создать `Dockerfile` для сборки и запуска `socket-server`.
        *   [x] Реализовать Socket.IO namespace `/chat` на выделенном сервере (в `socket-server/src/server.ts`).
        *   [x] Реализовать middleware для JWT аутентификации для Socket.IO подключений к неймспейсу `/chat` на выделенном сервере (в `socket-server/src/middlewares/authMiddleware.ts`).
        *   [x] Интегрировать Redis adapter (`@socket.io/redis-adapter`) с выделенным Socket.IO сервером.
        *   [x] Реализовать базовое подключение/отключение клиентов к неймспейсу `/chat` с логированием на выделенном сервере.
        *   [x] Реализовать отправку/получение простых текстовых сообщений в реальном времени на выделенном Socket.IO сервере (события `sendMessage`/`receiveMessage`), пока без сохранения в БД.
        *   [ ] **Проверить и настроить пути импорта** (`paths` в `socket-server/tsconfig.json`) для `#/constants` и `#/types` или локализовать эти ресурсы.
    *   **Адаптация Next.js клиента:**
        *   [ ] **Создать/Обновить** клиентскую обертку `src/lib/socket.ts` для подключения к выделенному Socket.IO серверу (URL через `NEXT_PUBLIC_SOCKET_URL`, передача JWT токена).
        *   [ ] **Определить/Обновить** типизацию для клиентского сокета (`src/types/socket.ts` или аналогичный файл с `ServerToClientEvents` и `ClientToServerEvents`).
        *   [ ] **Адаптировать** React-компоненты и хук `useChat` (`src/hooks/useChat.ts`) для работы с новой клиентской оберткой Socket.IO.
        *   [x] Настроить `.env` с `NEXT_PUBLIC_SOCKET_URL` для локальной разработки (задача пользователя).
    *   **Оркестрация Docker:**
        *   [x] Обновить `docker-compose.yml` для включения и конфигурации нового сервиса `socket-server`.
    *   **Общие задачи (после миграции):**
        *   [ ] Создать базовый UI для списка чатов и окна чата (клиентская часть).
        *   [x] Использовать константы для имен событий Socket.IO (`src/constants/socketEvents.ts`).

### Этап 5: Модели данных и API для чатов

*   **Статус:** Не начато
*   **Задачи:**
    *   [ ] Создать API для создания чатов (`src/app/api/chats/create/route.ts`).
    *   [ ] Создать API для получения списка чатов пользователя.
    *   [ ] Создать API для получения сообщений чата.
    *   [ ] Реализовать сохранение сообщений в БД через Prisma.

### Этап 6: Продвинутая функциональность сообщений

*   **Статус:** Не начато
*   **Задачи:**
    *   [ ] Реализовать E2E шифрование сообщений (`lib/crypto.ts`, Web Crypto API).
    *   [ ] Реализовать загрузку файлов.
    *   [ ] Реализовать ответы на сообщения.
    *   [ ] Реализовать редактирование и "мягкое" удаление (Soft Delete) сообщений.

### Этап 7: UI/UX и Компоненты

*   **Статус:** Не начато
*   **Задачи:**
    *   [ ] Интегрировать MUI (Material-UI).
    *   [ ] Разработать адаптивный дизайн.
    *   [ ] Реализовать `Drawer` и `BottomNavigation` для навигации.
    *   [ ] Добавить индикаторы новых сообщений.
    *   [ ] Реализовать `Installation prompt` для PWA.
    *   [ ] Разработать компоненты: `ChatList`, `ChatListItem`, `MessageBubble`, `ChatSettingsModal`, и т.д.

### Этап 8: Админ-панель

*   **Статус:** Не начато
*   **Задачи:**
    *   [ ] Создать маршруты для админ-панели в `src/app/admin/`.
    *   [ ] Использовать Server Components для получения данных.
    *   [ ] Реализовать основные функции управления (пользователи, чаты).

### Этап 9: Качество и CI/CD

*   **Статус:** Не начато
*   **Задачи:**
    *   [ ] Написать TSDoc для ключевых модулей, функций, API.
    *   [ ] Настроить Jest для unit-тестирования.
    *   [ ] Настроить Playwright для E2E-тестирования.
    *   [ ] Настроить GitHub Actions для CI/CD.
    *   [ ] Настроить мониторинг (Prometheus/Grafana).
    *   [ ] Интегрировать Sentry для отслеживания ошибок.

### Этап 10: Документация и Завершение

*   **Статус:** Не начато
*   **Задачи:**
    *   [ ] Обновить/дополнить `README.md`.
    *   [ ] Сгенерировать OpenAPI документацию для API.
    *   [ ] Финальное тестирование и рефакторинг.

## Примечания

*   **Next.js App Directory**: Активно использовать Server Components для data fetching ( `fetch()` внутри `page.tsx`/`layout.tsx`) и Client Components (`"use client"`) для интерактивности (Socket.IO, Zustand, обработчики событий). Route Handlers (`route.ts`) для API.
*   **PWA**: Через `next-pwa`.
*   **Документирование**: Обязательно документировать все API, ключевые методы, функции и модули. Добавлять описание к каждому файлу, где это применимо. 