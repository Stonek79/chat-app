# План миграции на монорепозиторий

Этот документ описывает пошаговый процесс перехода на архитектуру монорепозитория с использованием pnpm и Turborepo.

**Цели:**
- ✅ Устранить неявные зависимости и проблемы со сборкой Docker.
- ✅ Создать единый источник правды для общего кода (пакеты `@chat-app/*`).
- ✅ Оптимизировать процесс сборки и разработки.
- ✅ Заложить архитектурный фундамент для масштабирования и E2E-шифрования.

---

### **Раздел 1: Инструментарий и структура**

#### **1.1. Выбранные инструменты**
- **[✅] Менеджер пакетов:** `pnpm` (для эффективного управления зависимостями через workspaces).
- **[✅] Оркестратор задач:** `Turborepo` (для кэширования и запуска задач в правильном порядке).
- **[✅] Сборщик/компилятор TS-пакетов:** `tsup` (для быстрой компиляции пакетов).

#### **1.2. Реализованная структура проекта**
Это текущая структура монорепозитория после завершения ФАЗА 4-5. 
TODO доработать визуализацию структуры после окончательно формирования логики работы приложения

```plaintext
/chat-app
├── apps/                    # Директория для "запускаемых" приложений
│   ├── chat/                # Next.js приложение (Имя пакета: @chat-app/chat)
│   │   ├── src/             # Исходный код Next.js приложения
│   │   ├── public/
│   │   ├── next.config.ts
│   │   ├── tsconfig.json    # (Наследуется от ../../tsconfig.base.json)
│   │   └── package.json     # "dependencies": { "@chat-app/core": "workspace:*", "@chat-app/socket-shared": "workspace:*" }
│   │
│   └── socket-server/       # Socket.IO сервер (Имя пакета: @chat-app/socket-server)
│       ├── src/             # Исходный код сервера
│       ├── tsconfig.json    # (Наследуется от ../../tsconfig.base.json)
│       └── package.json     # "dependencies": { все пакеты @chat-app/* }
│
├── packages/                # Директория для переиспользуемых пакетов
│   ├── core/                # Основной пакет с типами, схемами, константами (Имя: @chat-app/core)
│   │   ├── src/
│   │   │   ├── constants/   # Глобальные константы (приложения, валидации, клиента)
│   │   │   ├── schemas/     # Все *.ts файлы с Zod-схемами (auth, chat, message, user)
│   │   │   ├── types/       # Все *.ts файлы с типами, выведенными из Zod
│   │   │   └── mappers/     # Мапперы для преобразования типов (toClientUser, toDisplayMessage)
│   │   ├── tsconfig.json
│   │   └── package.json     # (name: "@chat-app/core", main: "dist/index.js", types: "dist/index.d.ts")
│   │
│   ├── db/                  # Пакет базы данных (Имя: @chat-app/db)
│   │   ├── src/
│   │   │   └── prisma/
│   │   │       ├── schema.prisma # Схема Prisma
│   │   │       └── seed.ts       # Сидинг данных
│   │   ├── tsconfig.json
│   │   └── package.json     # Экспорт PrismaClient и типов
│   │
│   ├── server-shared/       # Серверные утилиты (Имя: @chat-app/server-shared)
│   │   ├── src/
│   │   │   ├── auth/        # JWT аутентификация, middleware, сессии
│   │   │   ├── config/      # Серверная конфигурация (секреты)
│   │   │   ├── redis/       # Redis клиент, кэш, pub/sub
│   │   │   └── utils/       # Крипто, ошибки, логирование
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── socket-shared/       # Socket.IO типы и утилиты (Имя: @chat-app/socket-shared)
│       ├── src/
│       │   ├── types/       # Типы событий, адаптеров, сокетов
│       │   ├── events/      # События Socket.IO
│       │   ├── client/      # Клиентский Socket.IO
│       │   └── server/      # Серверный Socket.IO с Redis адаптером
│       ├── tsconfig.json
│       └── package.json
│
├── .env.example             # Пример переменных окружения
├── .gitignore
├── docker-compose.yml       # Обновлен для работы с workspaces
├── Dockerfile               # Dockerfile для chat-приложения
├── Dockerfile.prisma-studio # Dockerfile для Prisma Studio
├── package.json             # Корневой package.json с определением workspaces и общими dev-скриптами
├── pnpm-workspace.yaml      # Файл конфигурации pnpm workspaces
├── tsconfig.base.json       # Базовый tsconfig.json для всего монорепозитория
└── turbo.json               # Файл конфигурации Turborepo
```

---

### **Раздел 2: Поэтапный план миграции**

#### **Этап 0: Подготовка (✅ ЗАВЕРШЕНО)**
- **[✅]** Создать полную резервную копию текущего проекта.
- **[✅]** Установить `pnpm` глобально: `npm install -g pnpm`.
- **[✅]** В корне проекта удалить `package-lock.json` и `node_modules`, затем выполнить `pnpm install` для перехода на `pnpm`.

#### **Этап 1: Инициализация Workspaces (✅ ЗАВЕРШЕНО)**
- **[✅]** В корне проекта создать директории `apps` и `packages`.
- **[✅]** Переместить существующий `socket-server` в `apps/socket-server`.
- **[✅]** Переместить все файлы и папки Next.js проекта (`src`, `public`, `next.config.ts` и т.д.) в `apps/chat`.
- **[✅]** Создать `pnpm-workspace.yaml` в корне проекта с содержимым:
  ```yaml
  packages:
    - 'apps/*'
    - 'packages/*'
  ```
- **[✅]** Очистить и настроить корневой `package.json`, оставив только общие `devDependencies` (`turbo`, `typescript`, `prettier`, `eslint`).
- **[✅]** Инициализировать Turborepo в корне проекта: `npx turbo init`.
- **[✅]** Запустить `pnpm install` в корне. На этом шаге все зависимости всех проектов установятся корректно.

#### **Этап 2: Создание пакетов `@chat-app/*` (✅ ЗАВЕРШЕНО)**
- **[✅]** В `packages/` создать директории `core`, `db`, `server-shared`, `socket-shared`, `constants-edge`.
- **[✅]** Создать `package.json` для каждого пакета с правильными именами и экспортами.
- **[✅]** Добавить `tsup` в `devDependencies` и настроить `build` скрипты.
- **[✅]** Распределить код по соответствующим пакетам:
  - `core`: типы, схемы, константы, мапперы
  - `db`: Prisma схема и клиент
  - `server-shared`: auth, config, redis, utils
  - `socket-shared`: Socket.IO типы и обработчики
  - `constants-edge`: Edge Runtime константы
- **[✅]** Настроить `tsconfig.json` для каждого пакета.
- **[✅]** Создать автогенерацию Edge констант из core пакета.

#### **Этап 3: Интеграция сервисов с пакетами `@chat-app/*` (✅ ЗАВЕРШЕНО)**
- **[✅]** В `apps/socket-server/package.json` добавить зависимости на все нужные пакеты.
- **[✅]** В `apps/socket-server` заменить все относительные импорты на абсолютные из workspace пакетов.
- **[✅]** В `apps/chat/package.json` добавить зависимости на `@chat-app/core`, `@chat-app/socket-shared`, `@chat-app/db`, `@chat-app/constants-edge`.
- **[✅]** В `apps/chat` заменить все импорты на workspace пакеты.
- **[✅]** В `apps/chat/next.config.ts` добавить `transpilePackages` для всех workspace пакетов.
- **[✅]** Запустить `pnpm install` в корне для связывания новых зависимостей.
- **[✅]** Исправить все импорты Socket.IO типов на `@chat-app/socket-shared`.
- **[✅]** Удалить неиспользуемый пакет `packages/shared`.

#### **Этап 4: Настройка сборки и Docker (🟡 ЧАСТИЧНО ЗАВЕРШЕНО)**
- **[✅]** Настроить `turbo.json`, определив зависимости между задачами.
- **[ ]** Создать `Dockerfile.chat` и `Dockerfile.socket-server` с использованием multi-stage builds для оптимизации.
- **[ ]** Обновить `docker-compose.yml` для использования новых Dockerfile и корректных контекстов сборки.

#### **Этап 5: Зачистка (🟡 ЧАСТИЧНО ЗАВЕРШЕНО)**
- **[✅]** Удалить дублирующиеся пакеты и правильно распределить зависимости.
- **[✅]** Проверить `dependencies` и `devDependencies` в `package.json` каждого приложения.
- **[✅]** Создать базовый `tsconfig.base.json` в корне, от которого наследуют все остальные.
- **[✅]** Удалить PWA зависимости и конфигурацию из `apps/chat`.
- **[ ]** Финальная оптимизация Docker конфигурации.

---

### **Раздел 3: Дальнейшие шаги (Post-migration)**
- **[ ]** Создать пакет `packages/eslint-config-custom` и централизовать правила линтинга.
- **[ ]** Рассмотреть внедрение генераторов кода (`plop.js`) для ускорения создания компонентов и фичей.
- **[ ]** Приступить к реализации E2EE, используя крипто-библиотеки.
- **[ ]** Реализовать полноценную работу с Read Replicas при развертывании в production-окружении.

---

### **Статус: ФАЗЫ 0-5 АРХИТЕКТУРНОГО РЕФАКТОРИНГА ЗАВЕРШЕНЫ ✅**

**Текущая архитектура пакетов:**
- `@chat-app/core`: Типы, схемы, константы, мапперы ✅
- `@chat-app/db`: Prisma клиент и схема ✅  
- `@chat-app/server-shared`: Серверные утилиты (auth, config, redis) ✅
- `@chat-app/socket-shared`: Socket.IO типы и обработчики ✅

**Готов к ФАЗЕ 6: ОБНОВЛЕНИЕ ПРИЛОЖЕНИЙ** 🚀 