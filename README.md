# Gym Members

Member admission, renewals, payments, dues and expenses for one gym, with a dashboard of income, expenses and profit. Mobile-first web app.

## Start

MongoDB must be running as a Windows service. Install once, then run both parts:

```
npm --prefix backend install
npm --prefix frontend install
npm --prefix backend run dev        # API on http://localhost:4000
npm --prefix frontend run dev       # app on http://localhost:5173 (also on your phone, same Wi-Fi)
```

The first visit asks you to create a login (mobile number + password). Set plan prices under **More → Plans and prices**.

Forgot the password? On the gym PC run `npm --prefix backend run reset-login`, then open the app and create a new login. No gym data is changed.

## Other commands

```
npm --prefix backend test           # rules + API tests (uses the gymsoft_test database)
npm --prefix frontend run build     # build the screens; `npm --prefix backend start` then serves them on port 4000
```

## Layout

- `shared/domain.mjs`: date, renewal and balance rules used by both sides
- `backend/src`: Express API on MongoDB (`gymsoft` database; override with `MONGO_URL`, `PORT`)
- `frontend/src`: React screens (`pages/`) and bottom-sheet forms (`sheets/`)
- `frontend/src/site`: public GymSolution website (`/` home, `/features`); every app page (`/dashboard`, `/members`, …) needs the login at `/login`

## WhatsApp reminders

`backend/src/whatsapp` sends renewal reminders through Baileys (no browser). Link the gym's number once under **Settings → WhatsApp reminders**.

- Two messages per member and renewal date, never more: on the renewal date and 2 days after, only if not renewed and not hidden.
- On demand: the server connects only when a reminder is pending and disconnects after 60 seconds idle. The login is stored in MongoDB.
- Sent between 8:00 and 21:00, at most 10 an hour and 40 a day, a few seconds apart. Change with `WHATSAPP_*` environment variables (see `whatsapp/config.js`).

## Rules worth knowing

- Dates are stored as `YYYY-MM-DD`. A membership covers its start date up to, not including, its renewal date.
- Balance = plan fee + admission fee − waived − payments. Refunds never create a new due.
- Payments are edited, moved or cancelled, and the change is logged. The one exception: deleting a whole membership made by mistake (the owner must type "delete") removes it together with its payments.
