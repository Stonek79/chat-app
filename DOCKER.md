# 🐳 Docker Deployment Guide

## 📋 Обзор

Наше приложение chat-app теперь полностью поддерживает Docker с монорепозиторием и правильной архитектурой пакетов.

## 🏗️ Архитектура

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App  │    │  Socket.IO       │    │   PostgreSQL    │
│   (Frontend)    │◄──►│  Server          │◄──►│   Database      │
│   Port: 3000    │    │   Port: 3001     │    │   Port: 5432    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  ▼
                       ┌─────────────────┐
                       │     Redis       │
                       │  Cache & PubSub │ 
                       │   Port: 6379    │
                       └─────────────────┘
```

## 🚀 Быстрый старт

### 1. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
# ==============================================================================
# ПРИМЕР ПЕРЕМЕННЫХ ОКРУЖЕНИЯ ДЛЯ DOCKER
# ==============================================================================

NODE_ENV=development

# Порты
NEXT_APP_PORT=3000
SOCKET_SERVER_PORT=3001
POSTGRES_PORT=5432
REDIS_EXT_PORT=6379

# PostgreSQL
POSTGRES_USER=chat_user
POSTGRES_PASSWORD=chat_password_2024
POSTGRES_DB=chat_app_db
DATABASE_URL=postgresql://chat_user:chat_password_2024@postgres:5432/chat_app_db

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_2024

# Безопасность (ОБЯЗАТЕЛЬНО поменяйте в продакшене!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars

# Socket.IO
SOCKET_NAMESPACE=/chat
```

### 2. Запуск всех сервисов

```bash
# Сборка и запуск всех контейнеров
docker-compose up --build

# Запуск в фоне
docker-compose up -d --build
```

### 3. Доступ к приложению

- **Frontend**: http://localhost:3000
- **Socket.IO Server**: http://localhost:3001  
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🛠️ Команды разработки

### Prisma Studio (опционально)

```bash
# Запуск с Prisma Studio для управления БД
docker-compose --profile dev up --build
```

Prisma Studio будет доступен на: http://localhost:5555

### Логи сервисов

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f next-app
docker-compose logs -f socket-server
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Остановка сервисов

```bash
# Остановка
docker-compose down

# Остановка с удалением volumes (ОСТОРОЖНО: удалит данные БД)
docker-compose down -v
```

## 📁 Структура Docker файлов

```
├── Dockerfile                 # Next.js приложение
├── Dockerfile.prisma-studio   # Prisma Studio для разработки
├── apps/socket-server/
│   └── Dockerfile             # Socket.IO сервер
├── docker-compose.yml         # Оркестрация сервисов
└── .dockerignore              # Исключения для Docker build
```

## 🔧 Настройка производственной среды

### 1. Обновите переменные окружения

```bash
NODE_ENV=production

# Используйте сильные пароли
POSTGRES_PASSWORD=сложный-пароль
REDIS_PASSWORD=сложный-пароль
JWT_SECRET=очень-длинный-случайный-ключ-минимум-32-символа

# Настройте правильные хосты
SOCKET_CORS_ORIGIN=https://yourdomain.com
```

### 2. Дополнительная безопасность

```yaml
# В docker-compose.yml для продакшена:
services:
  postgres:
    # Не экспозим порт наружу
    # ports:
    #   - "5432:5432"
    
  redis:
    # Не экспозим порт наружу  
    # ports:
    #   - "6379:6379"
```

## 🏆 Преимущества новой архитектуры

✅ **Монорепозиторий**: Все пакеты собираются вместе  
✅ **Безопасность**: Серверные секреты изолированы  
✅ **Производительность**: Multi-stage builds оптимизированы  
✅ **Масштабируемость**: Легко добавлять новые сервисы  
✅ **Типизация**: Полная поддержка TypeScript

## 🐛 Отладка

### Проблемы с сборкой

```bash
# Очистка Docker кэша
docker builder prune

# Пересборка без кэша
docker-compose build --no-cache
```

### Проблемы с зависимостями

```bash
# Проверка логов сборки
docker-compose build socket-server 2>&1 | tee build.log
```

### Подключение к контейнерам

```bash
# Подключение к Next.js контейнеру
docker exec -it next_app_chat sh

# Подключение к Socket.IO контейнеру  
docker exec -it socket_server_chat sh

# Подключение к PostgreSQL
docker exec -it postgres_db_chat psql -U chat_user -d chat_app_db
```

---

## 📝 Лицензия

Этот проект лицензирован под лицензией MIT.