# OceanSide

Production-oriented starter for a **Riverside.fm–style** studio: MERN stack with **TypeScript**, **JWT auth (access + refresh)**, **MongoDB**, **Socket.IO** signaling for **WebRTC**, and **Cloudinary** for recording uploads.

## Repository layout

| Path | Role |
|------|------|
| `backend/` | Express API, Mongoose models, Socket.IO, Zod validation, global error handler |
| `frontend/` | Vite + React, TanStack Query, Zustand, React Router, Tailwind v4, Framer Motion |
| `docker-compose.yml` | Local **MongoDB** only (API runs on the host or your own container) |

### Backend structure

- `src/controllers/` — HTTP handlers
- `src/services/` — Business logic
- `src/models/` — Mongoose schemas
- `src/routes/` — Route wiring
- `src/middlewares/` — Auth, validation, errors, rate limit
- `src/socket/registerSocket.ts` — Authenticated Socket.IO + WebRTC signaling
- `src/validations/` — Zod schemas

### Frontend structure

- `src/app/` — Router shell, `ProtectedRoute`
- `src/pages/` — Screens (landing, auth, dashboard, room)
- `src/features/` — API modules + `useRoomSession` (WebRTC)
- `src/components/ui/` — Reusable UI primitives
- `src/stores/` — Zustand (auth session)

## Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- [Cloudinary](https://cloudinary.com/) account (for uploads)

## Environment variables

### Backend (`backend/.env`)

Copy from `backend/.env.example` and set:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | Mongo connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | **≥32 chars** each |
| `JWT_ACCESS_EXPIRES` / `JWT_REFRESH_EXPIRES` | e.g. `15m`, `7d` |
| `CLOUDINARY_*` | From Cloudinary dashboard |
| `CORS_ORIGIN` | Frontend origin, e.g. `http://localhost:5173` |

### Frontend (`frontend/.env`)

See `frontend/.env.example`. For local dev, **leave `VITE_API_URL` unset** so requests use the Vite proxy to `http://localhost:8080`.

**Socket.IO** defaults to `http://localhost:8080` in development (`src/lib/env.ts`). Override with `VITE_SOCKET_URL` if the API runs elsewhere.

## Local setup

1. **MongoDB**

   ```bash
   docker compose up -d
   ```

   Or use Atlas and put the URI in `MONGODB_URI`.

2. **Backend**

   ```bash
   cd backend
   cp .env.example .env
   # edit .env — secrets + Cloudinary + CORS_ORIGIN

   npm install
   npm run dev
   ```

   Health: `GET http://localhost:8080/healthz`

3. **Frontend**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Open `http://localhost:5173`.

## API (MVP)

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/auth/register` | Body: `name`, `email`, `password` |
| POST | `/api/auth/login` | Returns `user`, `accessToken`, `refreshToken` |
| POST | `/api/auth/refresh` | Body: `refreshToken` |
| POST | `/api/auth/logout` | Bearer access token |
| GET | `/api/rooms` | Bearer |
| POST | `/api/rooms` | Body: `{ title }` |
| GET | `/api/rooms/:id` | Bearer; must be host or participant |
| POST | `/api/rooms/:id/join` | Adds current user to participants |
| GET | `/api/recordings/:roomId` | List recordings for room |
| POST | `/api/recordings` | `multipart/form-data`: `file`, `roomId`, `durationSeconds` |

## Deployment (outline)

1. **MongoDB**: Atlas or managed Mongo.
2. **Backend**: Set `NODE_ENV=production`, all env vars, `CORS_ORIGIN` to your web origin. Run `npm run build && npm start` or use a process manager / container.
3. **Frontend**: `npm run build` in `frontend/`; serve `frontend/dist` with any static host. Set `VITE_API_URL` and `VITE_SOCKET_URL` to your **public API** origin at **build time**.
4. **HTTPS**: Required in production for `getUserMedia` on many browsers; use TLS on both app and API.

## Phase 2 ideas (from spec)

Screen share, live streaming, waveforms, trimming UI, roles (host/guest), share links, downloads.

## Scripts

| Location | Command | Purpose |
|----------|---------|---------|
| `backend/` | `npm run dev` | ts-node-dev API + Socket.IO |
| `backend/` | `npm run build` | Compile to `dist/` |
| `frontend/` | `npm run dev` | Vite dev server |
| `frontend/` | `npm run build` | Production bundle |

---

MIT-style use: adapt credentials and hosting to your environment; rotate JWT secrets before any public deployment.
