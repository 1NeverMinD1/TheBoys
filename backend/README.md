# The Boys — бэкенд

NestJS + TypeORM + PostgreSQL. Отдаёт ровно те данные, которые фронт сейчас берёт из моков (`src/types/club.ts`, `src/types/booking.ts`).

## Быстрый старт

```bash
cd backend
cp .env.example .env          # Windows PowerShell: copy .env.example .env
docker compose up -d          # PostgreSQL 16 на localhost:5432 (или свой Postgres, см. .env)
npm install
npm run migration:run         # создать таблицы
npm run seed                  # залить 4 клуба из моков + тестовых пользователей
npm run start:dev             # http://localhost:3000, документация http://localhost:3000/docs
```

Тестовые аккаунты после `npm run seed`:

| Кто | Email | Пароль |
|---|---|---|
| Игрок (может оставить отзыв в Respawn Arena) | `player@theboys.kz` | `password123` |
| Админ клуба | `admin@<id клуба>.kz`, например `admin@respawn-arena.kz` | `admin12345` |

Пересоздать базу с нуля: `npm run db:reset`. Откатить последнюю миграцию: `npm run migration:revert`.

Тесты (нужна отдельная база `theboys_test`, она затирается):

```bash
docker compose exec postgres createdb -U theboys theboys_test
npm run test:e2e
```

## Договорённости с фронтом

1. **Стек:** NestJS 11 + TypeORM + PostgreSQL 16.
2. **Адрес API для разработки:** `http://localhost:3000` (без префикса `/api`). CORS открыт для `http://localhost:5173` (`CORS_ORIGINS` в `.env`).
3. **Авторизация:** JWT в заголовке `Authorization: Bearer <accessToken>`. Токен живёт 7 дней.
4. **Ошибки:** `{ "message": "...", "code": "..." }`. Для ошибок валидации добавляется `details: string[]`.
5. **Даты и время:** `date` — `YYYY-MM-DD`, `startTime` — `HH:mm`, оба по Астане (UTC+5). Метки времени (`createdAt` и т.п.) — ISO 8601 в UTC.

## Эндпоинты

### Клубы и места (без авторизации)

| Метод | Путь | Ответ |
|---|---|---|
| GET | `/clubs?q=&city=&zones=vip,bootcamp&maxPrice=&minHz=&free=1&24h=1&sort=rating\|price-asc\|price-desc\|seats` | `ClubSummary[]` |
| GET | `/clubs/:id` | `Club` |
| GET | `/clubs/:id/zones/:zoneId/seats?date=YYYY-MM-DD&startTime=HH:mm&hours=3` | `Seat[]` (+ `x`, `y` для схемы зала) |
| GET | `/clubs/:id/reviews` | `{ id, rating, text, createdAt, author: { name } }[]` |

Параметры `/clubs` называются так же, как в URL каталога (`src/lib/clubFilters.ts`), поэтому `location.search` можно передавать как есть.

`seatsFree` у зон считается по броням **на текущий момент**. В seats лучше передавать `hours` (длительность выбранного тарифа), чтобы «свободно» значило «свободно на весь сеанс». Без него проверяется один час.

### Авторизация

| Метод | Путь | Тело | Ответ |
|---|---|---|---|
| POST | `/auth/register` | `{ email, password (≥8), name, phone? }` | `{ accessToken, user }` |
| POST | `/auth/login` | `{ email, password }` | `{ accessToken, user }` |
| GET | `/auth/me` | — | `user` |

`user = { id, email, name, phone, role: "player" \| "club_admin", clubId }`

### Брони (нужен токен)

| Метод | Путь | Описание |
|---|---|---|
| POST | `/bookings` | Тело `BookingRequest`, ответ `Booking`. Статус `pending_payment`, места держатся 10 минут |
| GET | `/bookings/my` | Мои брони, новые сверху |
| GET | `/bookings/:id` | Одна бронь |
| POST | `/bookings/:id/cancel` | Отмена до начала сеанса. Если бронь оплачена, деньги возвращаются |

Что проверяет сервер при создании брони:
- зона принадлежит клубу, тариф принадлежит зоне;
- ночной тариф начинается строго в `timeFrom`, у пакета и ночи длительность берётся из тарифа;
- сеанс попадает в часы работы клуба (это учитывает клубы, работающие через полночь, например 10:00–04:00);
- время не в прошлом и не дальше чем на 30 дней вперёд;
- буткемп бронируется целиком (все места комнаты), цена считается за комнату;
- **сумму считает сервер** по той же формуле, что `calcTotal`. Если присланный `total` не совпал, возвращается `409 PRICE_CHANGED`;
- у одного пользователя не больше 3 неоплаченных броней (`429 TOO_MANY_PENDING`).

Защита от двойной брони работает в два слоя. Внутри транзакции строки мест блокируются через `SELECT … FOR UPDATE`. Кроме того, в базе стоит ограничение `EXCLUDE USING gist`, которое физически не даёт записать два пересекающихся активных интервала на одно место. В тестах 5 одновременных запросов на одно место дают ровно один успех.

Ответ `Booking` совпадает с типом фронта и содержит дополнительные поля: `expiresAt` (до какого момента нужно оплатить, для таймера), `startsAt`, `endsAt`, `clubName`, `zoneName`, `tariffName`, `seatNumbers`.

Статусы: `pending_payment`, `confirmed`, **`cancelled`, `expired`**. Последние два нужно добавить в тип `Booking["status"]` на фронте.

### Оплата (нужен токен)

| Метод | Путь | Описание |
|---|---|---|
| POST | `/payments` | `{ bookingId }` → `{ id, bookingId, amount, status, provider, paymentUrl }` |
| GET | `/payments/:id` | Статус платежа |
| POST | `/payments/:id/mock-confirm?success=1` | **Только для тестового режима:** «оплатить» без денег |
| POST | `/payments/webhook/:provider` | Уведомления от реального провайдера |

Пока подключён тестовый провайдер (`PAYMENT_PROVIDER=mock`), он не списывает деньги. Реальный эквайринг (Kaspi Pay, CloudPayments, ioka и т.п.) подключается так: реализовать интерфейс `src/payments/providers/payment-provider.interface.ts` и добавить его в `payments-core.module.ts`. Остальной код менять не нужно.

Если оплата пришла уже после того, как бронь истекла, деньги автоматически возвращаются (`409 BOOKING_EXPIRED`).

### Отзывы (нужен токен)

| Метод | Путь | Описание |
|---|---|---|
| POST | `/clubs/:id/reviews` | `{ rating: 1..5, text? }`. Только если была подтверждённая бронь, которая уже началась |
| DELETE | `/clubs/:id/reviews/my` | Удалить свой отзыв |

Рейтинг пересчитывается сразу. «Исторический» рейтинг из моков (4.8 по 214 отзывам) сохраняется, новые оценки добавляются к нему средневзвешенно.

### Кабинет клуба (токен админа этого клуба)

| Метод | Путь |
|---|---|
| GET | `/admin/clubs`: мои клубы |
| PATCH | `/admin/clubs/:clubId`: название, адрес, описание, часы работы, фото, оснащение |
| POST / PATCH / DELETE | `/admin/clubs/:clubId/zones[/:zoneId]` (при создании можно передать `seatsCount`) |
| POST / PATCH / DELETE | `/admin/clubs/:clubId/zones/:zoneId/tariffs[/:tariffId]` |
| GET / PUT | `/admin/clubs/:clubId/zones/:zoneId/layout`: схема зала `{ seats: [{ number, x, y }] }` |
| GET | `/admin/clubs/:clubId/bookings?date=&status=` |
| POST | `/admin/clubs/:clubId/bookings/:id/confirm`: подтвердить (оплата на кассе) |
| POST | `/admin/clubs/:clubId/bookings/:id/cancel` |

Зоны и тарифы удаляются «мягко»: они скрываются, но остаются в базе, потому что на них ссылаются старые брони. Зону с активными бронями скрыть нельзя, и места с будущими бронями нельзя убрать со схемы.

## Структура

```
src/
  main.ts                 запуск: CORS, валидация, формат ошибок, Swagger
  app.module.ts           сборка модулей
  common/                 ошибки {message, code}, время по Астане, декораторы
  database/               настройки TypeORM, миграции, сиды
  users/  auth/           пользователи, JWT, роли
  clubs/                  клубы, зоны, тарифы, места, занятость
  bookings/               брони, удержание 10 минут
  payments/               оплата и возвраты (провайдер подключается отдельно)
  reviews/                отзывы и рейтинг
  admin/                  кабинет клуба
test/app.e2e-spec.ts      сквозные тесты всех сценариев
```

## Таблицы

`users`, `clubs`, `zones`, `tariffs`, `seats`, `bookings`, `booking_seats`, `payments`, `reviews`. Схема описана в `src/database/migrations/1760500000000-InitSchema.ts`.
