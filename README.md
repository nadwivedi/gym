# Gym Members

Member admission, renewals, payments and dues for one gym. Mobile-first web app.

## Start

MongoDB must be running as a Windows service. Install once, then run both parts:

```
npm --prefix backend install
npm --prefix frontend install
npm --prefix backend run dev        # API on http://localhost:4000
npm --prefix frontend run dev       # app on http://localhost:5173 (also on your phone, same Wi-Fi)
```

The first visit asks you to set a PIN. Set plan prices under **More → Plans and prices**.

## Other commands

```
npm --prefix backend test           # rules + API tests (uses the gymsoft_test database)
npm --prefix frontend run build     # build the screens; `npm --prefix backend start` then serves them on port 4000
```

## Layout

- `shared/domain.mjs`: date, renewal and balance rules used by both sides
- `backend/src`: Express API on MongoDB (`gymsoft` database; override with `MONGO_URL`, `PORT`)
- `frontend/src`: React screens (`pages/`) and bottom-sheet forms (`sheets/`)

## Rules worth knowing

- Dates are stored as `YYYY-MM-DD`. A membership covers its start date up to, not including, its renewal date.
- Balance = plan fee + admission fee − waived − payments. Refunds never create a new due.
- Payments are never deleted: they are edited, moved or cancelled, and the change is logged.
