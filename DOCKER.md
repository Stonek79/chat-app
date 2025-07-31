# 🐳 Docker: Руководство по запуску и разработке

## 📋 Обзор

Это руководство описывает, как запустить и разрабатывать приложение **chat-app** с использованием Docker. Конфигурация разделена для **разработки (development)** и **производства (production)**.

### Архитектура сервисов

```mermaid
graph TD;
    subgraph "Docker-контейнеры"
        A[Next.js App <br/> Port: 3000]
        B[Socket.IO Server <br/> Port: 3001]
        C[PostgreSQL <br/> Port: 5432] // <-- ДОБАВИТЬ ЭТОТ СЕРВИС
        D[Redis <br/> Port: 6379]
        E[MinIO Storage <br/> Port: 9000/9001] // <-- УТОЧНИТЬ ПОРТЫ
        F[Nginx Proxy <br/> Port: 8080]
    end
    
    User[Пользователь] -->|HTTP| A;
    A -->|Socket.IO| B;
    A -->|API| C;
    B --> C;
    A --> D;
    B --> D;
    A -->|Загрузка медиа| E;
    User -->|Просмотр медиа| F;
    F --> E;
```

## 🚀 Запуск в режиме разработки (Development)

### 1. Переменные окружения

Убедитесь, что у вас есть файл `.env` в корне проекта с настройками для разработки. Если его нет, скопируйте из примера:
```bash
cp .env.example .env
```

### 2. Запуск

Просто выполните одну команду. Она автоматически использует `docker-compose.yml` и `docker-compose.override.yml` для создания dev-окружения с hot-reload.

```bash
docker compose up --build
```
> При первом запуске сборка может занять несколько минут. Последующие запуски будут значительно быстрее.

Приложение будет доступно по адресу `http://localhost:3000`.

## 🏭 Запуск в режиме производства (Production)

### 1. Переменные окружения для Production

Создайте файл `.env.production` и заполните его боевыми настройками (реальные домены, `NODE_ENV=production`, сложные секреты).

### 2. Запуск

Используйте флаг `--env-file`, чтобы указать Docker Compose использовать ваш production-конфиг.

```bash
docker compose --env-file .env.production up --build -d
```
> Флаг `-d` запускает контейнеры в фоновом режиме (detached).

## 🛠️ Полезные команды

### Просмотр логов
```bash
# Логи всех сервисов в реальном времени
docker compose logs -f

# Логи конкретного сервиса
docker compose logs -f next_app_chat
```

### Остановка
```bash
# Остановить все сервисы
docker compose down

# Остановить и удалить все данные (базу данных, кэш, медиа-файлы)
docker compose down -v
```

### Prisma Studio (только для разработки)
Для работы с базой данных через UI можно запустить Prisma Studio.
```bash
# Запуск с профилем 'dev', который включает Prisma Studio
docker compose --profile dev up
```
Prisma Studio будет доступен по адресу `http://localhost:5555`.


## 📁 Файлы конфигурации

-   **`Dockerfile`**: Основной файл для сборки `next-app`. Использует multi-stage build для создания оптимизированного образа для production и dev-стейджа для разработки.
-   **`apps/socket-server/Dockerfile`**: Аналогичный Dockerfile для `socket-server`.
-   **`docker-compose.yml`**: Основной файл, описывающий все сервисы для **production**.
-   **`docker-compose.override.yml`**: Файл для **разработки**. Переопределяет настройки для запуска dev-серверов и включает hot-reload.
-   **`Dockerfile.prisma-studio`**: Легковесный Dockerfile для запуска Prisma Studio.
-   **`DOCKER.md`**: Это руководство.
