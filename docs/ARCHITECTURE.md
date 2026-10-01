# Architecture Document

---

## Frontend

React.js + Tailwind CSS + Lucide React

---

## Backend

Node.js + Express.js (RESTful API architecture & middleware)

---

## Real-Time Engine

Socket.io (WebSocket signaling, live feed events, request queue management)

---

## Video Infrastructure

Agora.io WebRTC SDK (interactive multi-party video/audio streaming)

---

## Database

MongoDB Atlas (NoSQL BSON collections for users & room metadata)

---

## Authentication

JWT (JSON Web Tokens) with custom authentication middleware

---

## Deployment

* **Frontend:** Vercel


* **Backend:** Render / Railway


* **Database:** MongoDB Cloud



---

## High-Level System Architecture Flow

```text
User / Browser
   │
   ├── (HTTP / REST API) ──────► Express.js Server ───► MongoDB Atlas
   │                                   │
   ├── (WebSockets / Socket.io) ───────┤ (Signaling & Live Status Updates)
   │                                   │
   └── (WebRTC Media Stream) ──────────┴──────────────► Agora.io Video Infrastructure

```

---

## Project Folder Structure

```text
mmm-platform/
├── client/                     # Frontend Application (React.js)
│   ├── public/
│   └── src/
│       ├── assets/             # Images, icons, static assets
│       ├── components/         # Reusable presentation UI elements (Buttons, Modals, Inputs)
│       ├── features/           # Feature-based components & modules
│       │   ├── auth/           # Login, Register, Verification forms
│       │   ├── dashboard/      # Live feed grid, Room cards, Alma Mater filters
│       │   ├── room/           # Agora video canvas, Mic/Cam controls, Request queue UI
│       │   └── search/         # Skill and alumni filtering forms
│       ├── context/            # React Context providers (AuthContext, SocketContext)
│       ├── hooks/              # Custom React hooks (useAgora, useSocket, useAuth)
│       ├── services/           # Axios API client calls (auth.service.js, room.service.js)
│       ├── types/              # JS Doc / TypeScript definitions & prop types
│       └── utils/              # Helper functions, formatters, constants
│
└── server/                     # Backend Application (Node.js + Express.js)
    ├── config/                 # Environment variables, DB connections (db.js, agora.js)
    ├── controllers/            # Route controllers handling business logic (auth, rooms, users)
    ├── middleware/             # Custom Express middleware (authMiddleware, errorHandler)
    ├── models/                 # MongoDB Mongoose schemas (User.js, Room.js)
    ├── routes/                 # Express API endpoint definitions
    ├── sockets/                # Socket.io event handlers (roomHandlers.js, feedHandlers.js)
    ├── services/               # Core business services & Agora token generators
    └── utils/                  # Helper utilities and custom logger

```

---

## Architectural Rules

* **UI & Data Separation:** React components must not perform direct database queries or raw socket signaling; data fetching must pass through service modules or dedicated custom hooks.
* **Database Abstraction:** Database operations (Mongoose models and queries) belong exclusively within backend controllers and services.
* **Server-Side Authentication & Authorization:** All protected REST endpoints and Socket.io event listeners must verify JWT tokens on the server side prior to execution.
* **Real-Time Decoupling:** Video media streaming must be handled by Agora.io SDK, while socket communication is restricted to signaling, room state updates, and queue management.
* **Modular UI Components:** Reusable design elements (e.g., badges, primary buttons, input fields) must be placed in `components/`, whereas domain-specific views (e.g., room video feeds, request queues) belong in `features/`.