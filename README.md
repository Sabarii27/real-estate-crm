# Real Estate CRM

A small, polished internal CRM for a real estate sales team to manage leads, property inventory, and bookings — built as a full-stack technical assignment.

---

## Overview

Sales employees and admins can track leads through a sales pipeline (New → Contacted → Site Visit → Interested → Negotiation → Booked / Lost), manage a Project → Building → Unit property hierarchy, and book available units for leads — with the backend guaranteeing that **two people can never successfully book the same unit**, even if they click "Confirm" at the same instant.

## Features

- **Authentication** — JWT login, bcrypt password hashing, protected routes, role-based access (Admin / Sales Employee), enforced on the backend (not just hidden UI).
- **Lead management** — create/edit/search/filter leads, stage pipeline, notes, follow-up dates, an activity/history log, and lead assignment (Admin only).
- **Property hierarchy** — Project → Building → Unit, with unit type/floor/price/availability, filtering, and admin CRUD.
- **Booking flow** — a guided 4-step flow (lead → project/building → unit → review & confirm) that atomically claims a unit, preventing double-booking.
- **Dashboard** — KPIs, leads-by-stage chart, today's/upcoming follow-ups, recent bookings, and unit inventory, scoped per-role (sales employees see only their own leads/bookings; the property inventory numbers are global).
- **Professional UX** — loading/empty/error states everywhere, toast notifications, confirmation dialogs, responsive layout, consistent design system.

## Tech Stack

**Frontend:** React 18, Vite, JavaScript, React Router, Bootstrap 5 + custom CSS, Axios, Context API, Recharts, Lucide React
**Backend:** Node.js, Express, JavaScript, JWT, bcryptjs, Mongoose
**Database:** MongoDB

No TypeScript, Next.js, Tailwind, Firebase, SQL, or Redux — per the assignment's constraints.

## Architecture

```
real-estate-crm/
├── server/                     # Express API
│   └── src/
│       ├── config/db.js        # Mongo connection
│       ├── models/             # Mongoose schemas
│       ├── controllers/        # Business logic
│       ├── middleware/         # auth, roles, error handling, id validation
│       ├── routes/             # Express routers
│       ├── utils/              # ApiError, asyncHandler, token, constants
│       ├── seed/seed.js        # Demo data seeder
│       ├── app.js              # Express app (no listen)
│       └── server.js           # Entry point (connects DB, starts server)
└── client/                     # React SPA
    └── src/
        ├── components/
        │   ├── common/         # Button, Modal, Input, Select, Table, Badge,
        │   │                   # Loading, EmptyState, ErrorState, ConfirmDialog
        │   ├── layout/         # Sidebar, Header, AppLayout, ProtectedRoute
        │   ├── leads/ properties/ users/   # feature-specific form modals
        ├── pages/               # Route-level pages
        ├── context/             # AuthContext, ToastContext
        ├── services/            # Axios instance + one service per resource
        ├── utils/                # formatters, shared constants
        ├── App.jsx / main.jsx
```

Both layers are a deliberately flat, conventional MVC-ish structure — no microservices, no unnecessary abstraction layers — since the brief asks for a small, complete product rather than an enterprise system.

## Database Design

```
Project 1───* Building 1───* Unit 1───0..1 Booking *───1 Lead
                                                          ↑
                                                     assignedTo → User
```

- **User** — `name, email (unique), password (hashed, select:false), role (admin|sales), isActive`.
- **Lead** — `name, email, phone, source, stage, assignedTo (→User), followUpDate, notes[] (embedded), activity[] (embedded), createdBy (→User)`. Notes and activity are embedded sub-documents rather than separate collections — they're always read/written together with the lead, are unbounded but small in practice, and embedding avoids extra round trips on the lead detail page (this is the "improve the schema" trade-off explained further below).
- **Project** — `name, location, description`.
- **Building** — `project (→Project), name, description`. Unique compound index on `(project, name)`.
- **Unit** — `project (→Project), building (→Building), unitNumber, floor, type, price, status (Available|Booked)`. Unique compound index on `(building, unitNumber)`. `project` is denormalized onto `Unit` (in addition to `building`) purely to make inventory queries/filters (e.g. "available units in project X") a single-collection query instead of a join through Building.
- **Booking** — `lead (→Lead), unit (→Unit), project, building, price (snapshotted from the unit at booking time), bookedBy (→User), bookingDate, status (Confirmed|Cancelled), notes`. `project`/`building`/`price` are denormalized snapshots so a booking's historical record stays meaningful even if the unit's price or the building's name changes later.

Indexes: `Lead` has a text index on `name/email/phone` for search, plus indexes on `stage` and `assignedTo` for filtering. `Unit` is indexed on `status`. `Booking` has a **partial unique index** on `unit` scoped to `status: "Confirmed"` — see "Booking Concurrency" below.

## API Overview

All routes are prefixed with `/api` and (except `/auth/login`) require `Authorization: Bearer <token>`.

| Method | Route | Access | Notes |
|---|---|---|---|
| POST | `/auth/login` | Public | Returns `{ token, user }` |
| POST | `/auth/register` | Public if 0 users exist, else Admin | Initial setup convenience |
| GET | `/auth/me` | Authenticated | Current user |
| GET/POST | `/leads` | Authenticated | Sales see only their assigned leads; search/stage/assignedTo filters + pagination |
| GET/PUT | `/leads/:id` | Authenticated (scoped) | |
| DELETE | `/leads/:id` | Admin | Blocked if lead has an active booking |
| POST | `/leads/:id/notes` | Authenticated (scoped) | |
| GET/POST | `/projects`, `/buildings`, `/units` | Authenticated (write=Admin) | Filters: project/building/type/status |
| PUT/DELETE | `/projects/:id`, `/buildings/:id`, `/units/:id` | Admin | Deletes blocked if children/bookings still reference the record |
| GET/POST | `/bookings` | Authenticated | **Double-booking protection — see below** |
| PUT | `/bookings/:id` | Authenticated (scoped) | Cancelling releases the unit |
| GET | `/dashboard/stats` | Authenticated | Scoped per role |
| GET/POST/PUT/DELETE | `/users` | Admin | Delete blocked if the user still has assigned leads |

## Authentication & Roles

JWTs are signed with `JWT_SECRET` and carry `{ id, role }`. `protect` middleware verifies the token and loads the user; `authorize(...roles)` middleware gates admin-only routes. Beyond route-level gating, **object-level** authorization is enforced in controllers:

- A sales employee's `GET/PUT /leads`, `/leads/:id`, and `/bookings` queries are always scoped with `assignedTo: req.user._id` / `bookedBy: req.user._id` — they cannot view or modify another employee's leads or bookings, even by guessing an ID.
- Only Admins may reassign a lead (`assignedTo`) or manage Projects/Buildings/Units/Users.
- Passwords are never returned by the API (`select: false` on the schema + a `toSafeObject()` helper).

## Booking Concurrency

This is the most important business rule in the assignment: **two users must never be able to successfully book the same unit.**

The frontend never trusts its own "is this unit available?" check — it's purely a UX convenience. The real guarantee is enforced in `bookingController.createBooking` with an **atomic, conditional update**:

```js
const claimedUnit = await Unit.findOneAndUpdate(
  { _id: unitId, status: 'Available' },   // condition checked and applied atomically
  { $set: { status: 'Booked' } },
  { new: true }
);
if (!claimedUnit) {
  // someone else claimed it a moment earlier
  return 409 "Unit is no longer available."
}
```

MongoDB executes `findOneAndUpdate` as a single atomic document operation. If two booking requests for the same unit arrive at virtually the same instant, MongoDB serializes them internally: exactly one `findOneAndUpdate` call matches `status: 'Available'` and flips it to `'Booked'`; the other call finds zero matching documents (because the status has already changed) and returns `null`. The losing request gets an immediate, clear `409 Conflict` — no race window, no "check-then-act" gap.

This approach was chosen over a multi-document `mongoose` **transaction** because transactions require a MongoDB replica set, which most local/dev setups (and this assignment's expected environment) don't run by default. A single atomic `findOneAndUpdate` gives the same correctness guarantee for this specific rule (a single-document state transition) without that infrastructure requirement, and is the standard MongoDB pattern for this kind of "claim a resource" problem.

As **defense in depth**, `Booking` also has a partial unique index:

```js
bookingSchema.index({ unit: 1 }, { unique: true, partialFilterExpression: { status: 'Confirmed' } });
```

So even if a future code change reintroduced a race (e.g. someone bypassed the controller), MongoDB itself would reject a second `Confirmed` booking for the same unit with a duplicate-key error — which the controller catches, rolls the unit back to `Available`, and returns `409`.

If the booking document fails to create for any other reason after the unit was claimed, the controller rolls the unit back to `Available` in a `catch` block, so a partial failure never leaves a unit stuck as "Booked" with no booking record.

Cancelling a booking (`PUT /bookings/:id` with `status: 'Cancelled'`) releases the unit back to `Available` and moves the lead's stage to `Negotiation`.

## Lead Business Logic

- Stages: `New → Contacted → Site Visit → Interested → Negotiation → Booked | Lost`.
- `stage` cannot be set to `"Booked"` directly via the lead update endpoint — it's only ever set as a side effect of a successful booking, keeping "a booking exists" and "the lead is Booked" always in sync.
- Marking a lead `Lost` does not touch any booking, and a `Lost` lead cannot be selected in the booking flow.
- Every stage change, reassignment, and note is appended to the lead's embedded `activity[]` log, shown on the Lead Details page.

## Important Design Decisions

1. **Atomic conditional update over a transaction for booking concurrency.** Explained in detail above — chosen because it gives the exact same single-document correctness guarantee without requiring a replica-set-only feature, and is backed by a partial unique index as a second line of defense.
2. **Denormalized snapshot fields on `Booking` (`project`, `building`, `price`).** A booking is a historical record. If a unit's price is corrected later, or a building is renamed, the booking should still show what the customer actually agreed to at the time — so those fields are copied onto the booking at creation time instead of always being looked up live.
3. **Embedded `notes[]` and `activity[]` on `Lead` rather than separate collections.** Both are always read and written alongside the lead itself (lead detail page, note form), are bounded in practical size, and embedding avoids extra queries/joins for a very common read path, at the cost of the lead document growing over the lead's lifetime — an acceptable trade-off at CRM scale.
4. **Backend-enforced, per-record authorization for sales employees**, not just hidden buttons. Every lead/booking query for a `sales` role is filtered server-side by `assignedTo`/`bookedBy`, so the restriction holds even against a direct API call with a guessed ID.
5. **Reusable, minimal component library on the frontend** (`Button`, `Modal`, `Input`, `Select`, `Table`, `Badge`, `Loading`, `EmptyState`, `ErrorState`, `ConfirmDialog`, toast system) instead of a UI kit — keeps the bundle small, keeps every state (loading/empty/error) consistent across pages, and matches the assignment's "avoid unnecessary libraries" constraint while still avoiding duplicated markup.

## Setup Instructions

**Prerequisites:** Node.js 18+, a running MongoDB instance (local or Atlas).

```bash
# 1. Clone / unzip the project
cd real-estate-crm

# 2. Install server dependencies
cd server
npm install

# 3. Configure environment
cp .env.example .env
# edit .env if your Mongo URI, port, or JWT secret should differ

# 4. Start MongoDB (skip if using a hosted Atlas cluster)
# e.g. `mongod --dbpath /path/to/data` if running it locally

# 5. Seed demo data (users, projects, buildings, units, leads, bookings)
npm run seed

# 6. Start the backend
npm run dev          # nodemon, or `npm start` for a plain node run
# API now running at http://localhost:5000/api

# 7. In a new terminal, install & start the frontend
cd ../client
npm install
cp .env.example .env   # defaults to http://localhost:5000/api, edit if needed
npm run dev
# App now running at http://localhost:5173
```

## Demo Credentials

Created by `npm run seed` in the `server` folder:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@realestatecrm.com` | `Admin@123` |
| Sales Employee | `sales1@realestatecrm.com` | `Sales@123` |
| Sales Employee | `sales2@realestatecrm.com` | `Sales@123` |

The seed script also creates 2 projects, 3 buildings, 12 units (2 pre-booked), and 10 sample leads across every stage so the dashboard is populated immediately.

## Screenshots

Not included in this submission — run the app locally with the steps above and the seed data will populate a realistic dashboard, leads list, property hierarchy, and bookings page to screenshot from your own environment.

## Future Improvements

- Server-side pagination controls in the Leads/Units tables' UI (the API already supports `page`/`limit`)
- Email/SMS notifications for follow-ups and booking confirmations
- Bulk lead import (CSV)
- Audit log export
- Automated test suite (Jest/Supertest for the API, React Testing Library for the client)

---

## Known Limitations

- This build was assembled in a sandboxed environment without a running MongoDB server or outbound network access to fetch one, so while the backend was verified to install cleanly, load with zero errors, and pass a static syntax check on every file, and the frontend was verified to install and produce a clean production build, the full request/response cycle against a live database (including the concurrent-booking race itself) has **not** been exercised end-to-end in this environment. Please run through the Testing Checklist below after `npm run seed` in your own environment with MongoDB running — the concurrency logic follows the well-established atomic `findOneAndUpdate` pattern described above, but you should still verify it against a real database before relying on it.
- No automated test suite is included (see Future Improvements).
- File/image uploads (e.g. property photos) are out of scope, as they weren't part of the assignment brief.

## Testing Checklist

Use this after seeding, with both servers running:

**Auth:** admin login works · sales login works · invalid credentials rejected · visiting `/dashboard` while logged out redirects to `/login` · a sales user cannot open `/users`.

**Leads:** create/edit/search/filter a lead · sales user only sees their assigned leads · admin can reassign a lead · adding a note appears in the lead's note list and activity log · stage can be changed via the dropdown but not directly to "Booked".

**Properties:** create a project → building → unit as admin · edit a unit's price · filter units by type/status · deleting a project with buildings is rejected with a clear message.

**Bookings — the critical path:** run the 4-step booking flow to completion for an available unit · confirm the unit flips to `Booked` and the lead's stage flips to `Booked` · open two browser tabs, select the same unit in both, confirm in tab 1 (succeeds), then confirm in tab 2 (should return a `409` with "Unit is no longer available") · cancel a booking and confirm the unit becomes `Available` again.

**Dashboard:** KPI numbers match the seeded data · leads-by-stage chart renders · today's/upcoming follow-ups show the right leads · recent bookings list is populated.
