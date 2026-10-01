# Project Implementation Tasks

---

## Task Execution Workflow

```text
Select Next Task (TASK-XXX)
       │
       ▼
Implement Task Code & Services
       │
       ▼
Run Tests & Validate Functionality
       │
       ▼
Review Architecture & Rule Compliance
       │
       ▼
Mark Task as Complete [x]
       │
       ▼
Proceed to Next Sequential Task

```

---

## Phase 1: Project Setup & Infrastructure Configuration

* [x] **TASK-001: Repository & Workspace Initialization**
* Initialize client (`React.js` + `Tailwind CSS`) and server (`Node.js` + `Express.js`) directory structure.


* Configure root `package.json` for concurrent development workspace scripts.
* Set up Git repository with a standard `.gitignore` file.


* [x] **TASK-002: Tailwind CSS & Design Token Setup**
* Configure `tailwind.config.js` with color palette (`#6366F1` Primary, `#0F172A` Text, `#F8FAFC` Background).


* Define custom typography (Inter), border-radius utilities (`12px` cards, `8px` buttons), and badge styling rules.


* [x] **TASK-003: Backend Express & MongoDB Atlas Connection**
* Initialize Express server app with CORS, JSON body parser, and error handling middleware.


* Establish Mongoose connection to MongoDB Atlas cluster.


* Define environment configuration files (`.env`) for port numbers and database URIs.





---

## Phase 2: Database Schemas & Authentication Engine

* [x] **TASK-004: Mongoose Schemas Definition**
* Implement `User` schema supporting dual roles (`mentee`/`mentor`), skills, college tags, and mentor profile objects.


* Implement `Room` schema for tracking live micro-webinar states (`ongoing`, `scheduled`, `ended`), active participant lists, and pending join requests.




* [x] **TASK-005: Authentication API Routes & JWT Middleware**
* Build `POST /api/auth/register` and `POST /api/auth/login` controllers.


* Write JWT signing and token verification middleware (`authMiddleware.js`).


* Add institutional email domain check (`.edu` / `.ac.in`) logic for alumni verification.




* [x] **TASK-006: Frontend Authentication & Route Protection**
* Implement `AuthContext` to manage global user session state and JWT token persistence.
* Create Sign-Up and Login form components adhering to form error handling standards.
* Set up protected routing components to restrict unauthenticated access to the live feed and room views.



---

## Phase 3: Core Dashboard & Search Infrastructure

* [x] **TASK-007: Mentor Search & Discovery API**
* Build `GET /api/mentors` REST endpoint with filtering support for skills, companies, roles, and shared alma mater.


* Implement MongoDB text indexing on user skills and college attributes.




* [x] **TASK-008: Live Feed & Mentor Directory UI**
* Build `Dashboard` component featuring ongoing live room cards with category tags.


* Build `MentorSearch` filter bar and profile cards displaying verified alumni badges.


* Add Skeleton UI loading states (`animate-pulse`) and Empty state placeholders.



---

## Phase 4: Socket.io Real-Time Signaling Gateway

* [x] **TASK-009: Socket.io Server Setup & Connection Authentication**
* Initialize Socket.io server integrated with the Express HTTP server instance.


* Implement Socket middleware to verify JWT tokens during the handshake phase.




* [x] **TASK-010: Live Feed Real-Time Status Broadcasts**
* Implement `feed:status_change` socket events to broadcast new live sessions across dashboard clients in real time.


* Build frontend `useSocket` hook and sync active room lists dynamically without full page reloads.





---

## Phase 5: WebRTC Video Streaming & Request Queue System

* [ ] **TASK-011: Agora RTC Server Token Generation**
* Build secure `GET /api/rooms/:roomId/agora-token` REST endpoint using the Agora SDK on the backend.


* Verify room ownership or active participant status prior to token distribution.




* [ ] **TASK-012: Live Room Creation & Audio/Video Canvas UI**
* Implement `CreateRoomModal` for mentors to set session titles and topic tags.


* Build `VideoCanvas` component utilizing Agora React Web SDK to display local and remote media streams.


* Implement mute/unmute audio and video toggle controls.


* [ ] **TASK-013: Interactive "Request to Join" Stage Queue Pipeline**
* Implement `room:request_stage` socket event for mentees to request microphone/stage access.


* Build mentor `RequestQueueModal` UI displaying pending candidate requests.


* Implement `room:approve_stage` socket event to dynamically promote approved mentees to publishers in the Agora channel.





---

## Phase 6: End-to-End Testing & Deployment

* [ ] **TASK-014: Integration Testing & Socket Flow Validation**
* Write unit tests for authentication middleware and Agora token generation services.
* Perform integration testing for multi-user socket join/leave events and stage request state changes.




* [ ] **TASK-015: Production Deployment & Verification**
* Deploy frontend application to Vercel.


* Deploy Express API and Socket.io server to Render / Railway.


* Verify WebSocket signaling connections, Agora video streaming, and MongoDB Atlas database operations in the production environment.