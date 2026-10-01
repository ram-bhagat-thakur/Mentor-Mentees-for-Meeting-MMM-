# Architecture Decisions

---

## ADR-001: MERN Stack Architecture Over Serverless/Monoliths

### Decision

Use a decoupled **MERN Stack** architecture featuring a standalone **React.js** frontend and a dedicated **Node.js + Express.js** backend.

### Reason

* Real-time video web applications require sustained WebSocket signaling and queue state synchronization. Node.js with Socket.io provides persistent, low-latency, bi-directional TCP connections that are ill-suited for serverless or edge runtime limits.


* Separating client and server allows independent horizontal scaling of the backend API servers as live video participants and socket connections increase.



---

## ADR-002: Agora.io SDK for Multi-Party WebRTC Video Infrastructure

### Decision

Integrate the **Agora.io WebRTC SDK** for multi-party audio and video media streaming instead of building custom WebRTC Selective Forwarding Units (SFUs).

### Reason

* Managing custom raw WebRTC media servers (e.g., Janus, Mediasoup) introduces extreme infrastructure complexity, high maintenance overhead, and latency issues across geographic locations.


* Agora provides a developer-friendly SDK, global media routing networks, and a generous tier of 10,000 free participant-minutes per month, making it ideal for piloting and early scaling.



---

## ADR-003: Socket.io for Real-Time Event Signaling and Queue Management

### Decision

Use **Socket.io** strictly for real-time signaling, live feed status broadcasts, and candidate request queue state transitions.

### Reason

* Decouples interactive video streaming from real-time app states. Agora handles media routing while Socket.io manages instant UI updates (e.g., live "Request to Join" queue updates and mentor approvals).


* Built-in support for auto-reconnection, heartbeats, custom event namespaces, and room-scoped broadcasting (`socket.to(roomId)`).



---

## ADR-004: JWT Authentication Over Session-Based Cookies

### Decision

Implement **Stateless JWT (JSON Web Tokens)** passed via standard `Authorization: Bearer <token>` headers for REST APIs and query handshake parameters for Socket.io connections.

### Reason

* Ensures stateless authentication across independent REST API routes and persistent Socket.io WebSockets without relying on server-side session stores.


* Enables simple verification of user identity and role-based permissions (`mentee` vs `mentor`) across distributed backend instances.



---

## ADR-005: MongoDB Atlas as Primary Document Store

### Decision

Use **MongoDB Atlas** for data persistence, storing user profiles, mentor metadata, and live room states.

### Reason

* Flexible document schemas seamlessly accommodate varying user profile structures (e.g., mentors possessing company info, hourly rates, and skills versus mentees possessing academic year and college details).


* Native support for embedded arrays and sub-documents makes managing active participant lists (`activeParticipants`) and pending join queues (`joinRequests`) efficient.


* Built-in text indexing allows multi-parametric search filtering across skills, target companies, and college tags.