# Dental Lab MVP

Минимальный MVP для зуботехнической лаборатории на Next.js.

## Что есть

- Страница создания заказа: `/orders/new`
- Страница списка заказов: `/orders`
- SQLite база `orders.db`
- Поля заказа:
  - `clinic_name`
  - `doctor_name`
  - `patient_name`
  - `work_type`
  - `material`
  - `comment`
  - `due_date`
  - `status`
- Статусы:
  - `new`
  - `in_progress`
  - `ready`
  - `shipped`

## Установка

```bash
npm install
```

## Запуск в dev режиме

```bash
npm run dev
```

После запуска приложение будет доступно на `http://localhost:3000`.

## Production сборка

```bash
npm run build
npm run start
```

## Как хранится база

- SQLite-файл создаётся автоматически как `orders.db` в корне проекта.
- Таблица `orders` создаётся автоматически при первом обращении к приложению.
