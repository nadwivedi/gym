# Gym Members

Member admission, renewals, payments and dues for one gym. Mobile-first web app.

## Start

Double-click `start.bat` (MongoDB must be running as a Windows service). Then open:

- on this PC: http://localhost:4000
- on a phone on the same Wi-Fi: the `http://192.168…:4000` address printed in the window

The first visit asks you to set a PIN. Set plan prices under **More → Plans and prices**.

## After changing the code

```
npm --prefix frontend run build     # rebuild the screens served by start.bat
npm --prefix backend test           # rules + API tests (uses the gymsoft_test database)
```

For live editing run `npm --prefix backend run dev` and `npm --prefix frontend run dev` (http://localhost:5173).

## Layout

- `shared/domain.mjs`: date, renewal and balance rules used by both sides
- `backend/src`: Express API on MongoDB (`gymsoft` database; override with `MONGO_URL`, `PORT`)
- `frontend/src`: React screens (`pages/`) and bottom-sheet forms (`sheets/`)

## Rules worth knowing

- Dates are stored as `YYYY-MM-DD`. A membership covers its start date up to, not including, its renewal date.
- Balance = plan fee + admission fee − waived − payments. Refunds never create a new due.
- Payments are never deleted: they are edited, moved or cancelled, and the change is logged.
