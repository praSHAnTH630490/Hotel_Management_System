# Hotel Reservation System

A full-stack hotel / front-desk management app built with Node.js, Express and MySQL on the backend, and plain HTML, CSS and JavaScript on the frontend. No frameworks, no build step — just files a browser can run straight away.

The idea was to cover most of what a small hotel's front desk actually does day to day: booking rooms, checking guests in and out, handling payments, room service requests, cancellations, guest feedback, and a dashboard to see how the hotel is doing at a glance.

## Features

- Book a room and see live availability before you confirm the dates
- Check guests in and out, with room status updating automatically
- Manage guests, rooms, room types, amenities and staff (add / edit / delete)
- Record payments and mark them completed or failed
- Cancel a reservation with a reason and refund note
- Log room service requests (food, laundry, cleaning) and mark them done
- Collect star ratings and feedback after checkout
- Dashboard with occupancy, today's arrivals/departures, monthly revenue and average rating

## Tech stack

- **Backend:** Node.js, Express, MySQL (via `mysql2`)
- **Frontend:** Vanilla HTML/CSS/JS, served directly by Express
- **Database:** MySQL, schema in `db/schema.sql`

## Project structure

```
├── db/
│   ├── schema.sql       # table definitions
│   └── seed.sql         # sample data to play around with
├── server/
│   ├── index.js         # Express app + static file serving
│   ├── db.js             # MySQL connection pool
│   ├── setupDb.js        # runs schema.sql + seed.sql
│   └── routes/           # one route file per resource (rooms, reservations, staff...)
├── public/
│   ├── index.html
│   ├── css/styles.css
│   └── js/app.js, api.js
└── package.json
```

## Getting started

You'll need Node 18+ and a MySQL server running locally (or wherever you point it).

**1. Install dependencies**

```bash
npm install
```

**2. Set up your database connection**

Copy `.env.example` to `.env` and fill in your MySQL credentials:

```bash
cp .env.example .env
```

**3. Create the database and load sample data**

```bash
npm run db:init
```

This runs `db/schema.sql` to create the database and tables, then `db/seed.sql` to add some sample rooms, guests and bookings so the app isn't empty on first launch.

**4. Start the server**

```bash
npm start
```

Then open `http://localhost:4000`. The Express server serves the API and the frontend from the same origin, so there's no separate dev server or CORS setup to worry about.

Use `npm run dev` instead of `npm start` if you want the server to auto-restart while you're editing.

## A few implementation notes

- Double bookings are prevented at the database level — creating a reservation runs inside a transaction that locks any overlapping bookings for that room (`FOR UPDATE`), so two people can't book the same room for the same dates at once.
- You can't delete a guest, room or room type that still has reservations attached — the schema enforces this with `ON DELETE RESTRICT`, and the API returns a proper error instead of failing silently.
- Checking a guest in sets the room to Occupied; checking out (or cancelling a checked-in stay) sets it back to Available, so the dashboard and room grid always reflect what's actually going on.

## Troubleshooting

- `ECONNREFUSED` — MySQL isn't running, or the host/port in `.env` is wrong.
- `Access denied for user` — double check `DB_USER` / `DB_PASSWORD` in `.env`.
- Dashboard looks empty / "No rooms found" — run `npm run db:init` again, or add rooms manually from the Rooms page.

## Things I'd still like to add

- Authentication / login for staff instead of an open front desk console
- Automated tests for the booking and cancellation logic
- Basic input validation on the frontend forms
