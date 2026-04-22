# CampusCart

A hyperlocal delivery platform built for university campuses. Students order from campus vendors, student delivery partners fulfill the orders — fast, cheap, and campus-native.

> Built as an MVP for a single-campus pilot targeting ~200 orders/day.



## How It Works

**Three roles, one loop:**

1. **Student (buyer)** — browses vendors, places an order via the mobile app
2. **Vendor** — receives and manages the order from the web dashboard
3. **Student (delivery partner)** — picks up and delivers the order, tracked in real-time



## Tech Stack

| Layer | Tech |
|---|---|
| Mobile App | React Native (Expo) |
| Vendor Dashboard | React + Vite |
| Backend API | Node.js + Express |
| Database | PostgreSQL |
| Real-time | Socket.IO |
| Auth | JWT |



## Project Structure

```
CampusCart/
├── backend/              # Express REST API + Socket.IO server
│   └── src/
│       ├── routes/       # auth, orders, vendors, delivery, admin
│       ├── middleware/   # JWT auth
│       ├── socket/       # real-time order tracking
│       └── config/       # DB connection
├── mobile/               # React Native app (Expo)
└── vendor-dashboard/     # React web dashboard for vendors
```



## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Expo CLI (`npm install -g expo-cli`)

### 1. Backend

```bash
cd backend
cp .env.example .env      # fill in your DB credentials and JWT secret
npm install
npm run migrate           # run DB migrations
npm run dev               # starts on port 5000
```

### 2. Vendor Dashboard

```bash
cd vendor-dashboard
npm install
npm run dev               # starts on localhost:3000
```

### 3. Mobile App

```bash
cd mobile
npm install
npx expo start            # scan QR with Expo Go on your phone
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and set:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campuscart
DB_USER=postgres
DB_PASSWORD=sajanamity@123
JWT_SECRET=your_secret_key
```

---

## API Routes

| Prefix | Description |
|---|---|
| `/api/auth` | Register, login, JWT refresh |
| `/api/orders` | Place, track, and update orders |
| `/api/vendors` | Vendor profiles and menu |
| `/api/delivery` | Delivery partner flow |
| `/api/admin` | Admin controls |

---

## Status

Early MVP — single campus pilot phase. Core order flow is functional.


## Author

Sajan Dhakal
