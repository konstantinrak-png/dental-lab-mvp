# Dental Lab MVP

Мінімальний MVP для зуботехнічної лабораторії на Next.js.

## Що є в проєкті

- список замовлень `/orders`
- створення замовлення `/orders/new`
- inline-зміна статусу
- пошук і фільтри
- детальна сторінка замовлення
- завантаження і скачування файлів
- авторизація з ролями `admin` і `clinic`

## Локальний запуск

```bash
npm install
npm run dev
```

Після запуску застосунок буде доступний на `http://localhost:3000`.

## Production build

```bash
npm run build
npm run start
```

## Де зберігаються дані

Застосунок використовує змінну середовища `DATA_DIR`.

- якщо `DATA_DIR` не задано, локально все працює як раніше:
  - база: `./orders.db`
  - файли: `./uploads`
- якщо `DATA_DIR` задано, застосунок зберігає:
  - базу в `${DATA_DIR}/orders.db`
  - файли в `${DATA_DIR}/uploads`

Папки створюються автоматично тільки в runtime, коли застосунок реально працює з базою або файлами.
На етапі `next build` файлову систему для `DATA_DIR` застосунок не чіпає, тому Render build не падає, навіть якщо persistent disk ще не змонтований.

## Створення першого користувача

Перший `admin`:

```bash
npm run create-admin -- --email=admin@example.com --password=secret123
```

Користувач `clinic`:

```bash
npm run create-user -- --email=clinic@example.com --password=secret123 --role=clinic --clinic="My Clinic"
```

## Деплой на Render з SQLite і persistent disk

Цей проєкт можна деплоїти на Render без переходу на іншу базу даних, якщо використати Persistent Disk.

### 1. Створи Web Service

- `Environment`: `Node`
- `Build Command`: `npm install && npm run build`
- `Start Command`: `npm run start`

### 2. Додай Persistent Disk

У Render для сервісу додай disk, наприклад:

- `Mount Path`: `/var/data`

### 3. Додай environment variable

У Render додай:

```bash
DATA_DIR=/var/data
```

Тоді Render буде зберігати:

- SQLite базу в `/var/data/orders.db`
- завантажені файли в `/var/data/uploads`

### 4. Задеплой сервіс

Після першого деплою створи першого `admin` через Render Shell:

```bash
npm run create-admin -- --email=admin@example.com --password=secret123
```

За потреби створи clinic-користувача:

```bash
npm run create-user -- --email=clinic@example.com --password=secret123 --role=clinic --clinic="My Clinic"
```

### 5. Важливі примітки для Render

- без `Persistent Disk` SQLite і `uploads` будуть втрачатися при redeploy/restart
- `DATA_DIR` має вказувати саме на mount path диска
- локально `DATA_DIR` можна не задавати
- під час `build` Render може ще не мати доступу до disk mount, тому ініціалізація сховища відкладена до runtime
