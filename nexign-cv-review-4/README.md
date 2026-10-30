# Nexign CV Review

## Структура

```
public/index.html        — главная
public/internships.html  — стажировки
public/guide.html        — как подготовить CV
public/apply.html        — заявка на разбор
public/success.html      — заявка отправлена
public/css/style.css     — стили всех страниц
public/js/main.js        — меню, кнопка «В начало»
public/js/home.js        — вопросы и ответы
public/js/internships.js — список стажировок и фильтр
public/js/apply.js       — форма заявки
public/js/email-check.js — проверка email в браузере
public/js/success.js     — дата на странице успеха
public/img/              — стикеры, фон и картинка-заглушка
server.js                — сервер и приём откликов
```

## Запуск

Нужен Node.js 18 или новее. Зависимости ставить не нужно.

```
npm start
```

Откройте http://localhost:3000. Порт можно сменить: `PORT=8080 npm start`.

## Где хранятся отклики

- `data/applications.json` — все заявки (создаётся при первом запуске)
- `uploads/` — загруженные резюме (имена файлов случайные, наружу не раздаются)

Пример записи:

```json
{
  "id": "…",
  "createdAt": "2026-10-05T11:00:00.000Z",
  "status": "new",
  "name": "Иванов Иван Иванович",
  "email": "ivan@mail.ru",
  "directions": ["Менеджмент"],
  "consent": { "given": true, "at": "…" },
  "subscribe": false,
  "resume": { "originalName": "cv.pdf", "storedName": "….pdf", "size": 12345 },
  "expectedDate": "2026-10-19",
  "expectedDateRu": "19.10.2026"
}
```

## Просмотр откликов

Токен печатается в консоли при старте. Чтобы он не менялся, задайте его сами:
`ADMIN_TOKEN=мой-секрет npm start`.

- Список: `GET /api/applications` с заголовком `Authorization: Bearer <токен>`
- Резюме: `GET /api/applications/<id>/resume?token=<токен>`

## Проверки

- Email проверяется на опечатки в популярных доменах (gmail.co, mail.ry и т. п.), на корректный формат и на существование домена (MX/A-записи). Проверка выполняется и в браузере, и на сервере.
- Файл: только PDF до 10 МБ, тип проверяется по содержимому.
- Срок рекомендаций: 14 дней от даты подачи (по московскому времени).
- Не больше 10 заявок в час с одного IP.

## Перед публикацией в интернет

Поставьте перед сервером HTTPS (nginx, Caddy и т. п.) и задайте постоянный `ADMIN_TOKEN`. Резюме содержат персональные данные, поэтому ограничьте доступ к папкам `data/` и `uploads/`.
