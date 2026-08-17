<<<<<<< HEAD
<<<<<<< HEAD
# Aurelia — Hotel Reservation & Front Desk Console

A full-stack rebuild of the hotel reservation project around the new MySQL schema
(`db/schema.sql`). It replaces the old Java console app with a **Node.js/Express REST API**
and an **attractive vanilla-JavaScript front end** — no build tools, no framework, just
files a browser can run.

## What's included

Every table in the schema now has a matching feature in the app:

| Schema table     | Feature in the app                                              |
|-------------------|-------------------------------------------------------------------|
| `customer`        | Guests — search, add, edit, delete, view stay history            |
| `room_type`       | Room Types — CRUD, shows how many rooms use each type            |
| `room`            | Rooms — CRUD, status (Available/Occupied/Maintenance), amenities |
| `amenity` / `room_amenity` | Amenities catalogue + assign/remove per room             |
| `staff`           | Staff directory — CRUD, used to attribute check-ins/check-outs   |
| `reservation`     | Reservations — booking wizard with live room availability search |
| `check_in_out`    | Check-in / check-out actions on a reservation                    |
| `payment`         | Payments — record, mark completed/failed                         |
| `cancellation`    | Cancel a reservation with reason, refund and policy               |
| `feedback`        | Star ratings + comments for checked-out stays                    |
| `room_service`    | Food/laundry/cleaning requests, mark completed                   |

Plus a **Dashboard** with live occupancy stats, monthly revenue, guest ratings, and a
"key rack" visual showing every room's status at a glance.
=======
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
>>>>>>> a279060495cd0d513d644bc6551cd9e50e2da9ff

## Project structure

```
<<<<<<< HEAD
hotel-reservation-system/
├── db/
│   ├── schema.sql        # your schema, unchanged
│   └── seed.sql          # demo data (room types, rooms, guests, bookings...)
├── server/
│   ├── index.js          # Express app entry point
│   ├── db.js             # MySQL connection pool
│   ├── setupDb.js         # one-shot script: creates DB + tables + demo data
│   └── routes/           # one REST route file per table
├── public/                # the front end (served as static files)
│   ├── index.html
│   ├── css/styles.css
│   └── js/app.js, api.js
├── package.json
└── .env.example
```

## Requirements

- Node.js 18+ (uses ES modules and top-level `mysql2/promise`)
- A running MySQL 8 server (local install, Docker, or a cloud instance)

## Setup — from zero to running

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure your database connection**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your MySQL host/user/password. `DB_NAME` should stay
   `hotel_reservation_system` unless you also change it in `db/schema.sql`.

3. **Create the database, tables and demo data** (one command):
   ```bash
   npm run db:init
   ```
   This runs `db/schema.sql` (creates the database + all 11 tables, exactly as
   provided) and then `db/seed.sql` (sample room types, rooms, guests, staff and a
   few bookings so the app isn't empty on first run).

   Prefer to do it by hand? `mysql -u root -p < db/schema.sql` then
   `mysql -u root -p < db/seed.sql` works too.

4. **Start the server**
   ```bash
   npm start
   ```
   Then open **http://localhost:4000** in your browser. The Express server
   serves both the API (`/api/...`) and the front end from the same origin,
   so there's nothing else to configure — no CORS, no separate dev server.

   For auto-restart while editing server code: `npm run dev`.

## Using the app

- **Dashboard** — occupancy, today's arrivals/departures, monthly revenue,
  average guest rating, and the key rack (every room colour-coded by status).
- **Reservations** — "New Reservation" lets you pick a guest, choose dates, and
  see only the rooms that are actually free for those dates before you book.
  Each booking can then be checked in, checked out, or cancelled from the list.
- **Rooms** — add/edit rooms, change status, and assign amenities per room.
- **Guests** — search, add/edit, and see a guest's full stay history.
- **Payments / Room Service / Feedback / Cancellations** — record and track
  each, linked back to the originating reservation.
- **Room Types / Amenities / Staff** — the reference data everything else
  builds on.

## Notes on the rebuild

- The booking flow enforces no-double-booking at the database level: creating
  a reservation runs inside a transaction with a row lock (`FOR UPDATE`) on any
  overlapping reservations for that room, so two front-desk tabs can't double-book
  the same room for the same dates.
- Deleting a guest, room, or room type that still has reservations is blocked
  with a clear error, matching the schema's `ON DELETE RESTRICT` foreign keys.
- Checking in sets the room to `Occupied`; checking out (or cancelling a
  checked-in stay) sets it back to `Available` — the room grid and dashboard
  always reflect the true state.

## If something doesn't connect

- `Error: connect ECONNREFUSED` — MySQL isn't running, or the host/port in
  `.env` is wrong.
- `Access denied for user` — check `DB_USER`/`DB_PASSWORD` in `.env`.
- Blank dashboard / "No rooms found" — run `npm run db:init` to load the demo
  data, or add your own rooms via the **Rooms** page.
=======
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
>>>>>>> a279060495cd0d513d644bc6551cd9e50e2da9ff
=======
# Hotel_Management_System
>>>>>>> 40b99a5fb7f9c6c65f6055ca945800d88b6aae63
