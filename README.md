# QuickChat

QuickChat is a full-stack real-time chat application built with React and Node.js. It supports account registration/login, one-to-one messaging, live online presence, and profile editing.

## About The Project

QuickChat is designed as a lightweight messaging app where users can:
- Create an account and sign in
- See other registered users
- Chat in real time using Socket.IO
- View conversation history from MySQL
- Update profile details (name, bio, avatar preset)

The app uses REST APIs for auth/profile/history and WebSockets for live message delivery + presence updates.

## Tech Stack

Frontend (`QuickChat/client`):
- React 19
- React Router DOM 7
- Vite 7
- Tailwind CSS 4
- Socket.IO Client 4

Backend (`QuickChat/server`):
- Node.js (ES modules)
- Express 4
- Socket.IO 4
- Prisma ORM 6
- bcryptjs
- dotenv

Database:
- MySQL

## How It Works

1. User logs in or registers from the frontend (`/api/auth/login`, `/api/auth/register`).
2. User info is stored in `localStorage` as `qc_user`.
3. Home page loads users list and previous messages through REST:
- `GET /api/users`
- `GET /api/messages`
4. Frontend opens a Socket.IO connection to backend and emits `register` with `userId`.
5. Backend tracks online users and broadcasts `presence:update`.
6. When a user sends a message, frontend emits `message:send`.
7. Backend saves message in MySQL and emits `message:new` to sender + receiver rooms.

## Project Structure

```QuickChat/
    client/
    server/
```

## Prerequisites

- Node.js 18+ (Node.js 20+ recommended)
- npm
- MySQL server (local or remote)


## Installation

From project root:

```bash
cd QuickChat/server
npm install

cd ../client
npm install
```

## Database Setup (Prisma)

From `QuickChat/server`:

```bash
npm run prisma:generate
npm run prisma:push
```


## Run Locally

Run backend:

```bash
cd QuickChat/server
npm run dev
```

Run frontend in a second terminal:

```bash
cd QuickChat/client
npm run dev
```

## Run with Docker

From `QuickChat` directory:

```bash
docker compose up --build
```

Services:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/health
- MySQL: localhost:3306

Stop all containers:

```bash
docker compose down
```

Stop and remove DB volume too:

```bash
docker compose down -v
```

