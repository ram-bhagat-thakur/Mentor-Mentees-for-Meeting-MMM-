# Test Plan

---

## Authentication & Authorization

* [ ] User can register a new account as either a Mentee or Mentor.


* [ ] User can log in with valid credentials and receive a valid JWT token.


* [ ] User can register/verify with an institutional domain email (`.edu` / `.ac.in`) to obtain a "Verified Alumni" badge.


* [ ] Invalid credentials display explicit inline error messages.
* [ ] Unauthenticated users are redirected away from protected routes (`/dashboard`, `/room/:id`).
* [ ] Logged-out users cannot access or connect to active Socket.io namespaces or backend REST routes.



---

## Live Feed & Search Engine

* [ ] Dashboard displays all currently active, ongoing live rooms with correct category tags.


* [ ] Search input correctly filters mentors and rooms by skill tags, target companies, and shared alma mater.


* [ ] Dynamic Socket.io event (`feed:status_change`) updates the live dashboard feed instantly when a mentor starts or ends a room without requiring a full page refresh.


* [ ] Empty search results display a clear empty state UI.
* [ ] Skeleton UI displays while live feed data is loading.

---

## WebRTC Video Streaming & Stage Queue Pipeline

* [ ] Mentor can successfully create a new live room and publish local video/audio streams using Agora.io.


* [ ] Mentee can join an active room as an audience subscriber.


* [ ] Mentee can click "Request to Join" to enter the stage queue.


* [ ] Mentor receives the real-time join request notification via Socket.io in the request queue drawer.


* [ ] Mentor can accept or reject candidate requests.


* [ ] Accepting a request promotes the approved mentee to a publisher role, unmuting/enabling their local stream in the Agora channel.


* [ ] Mentor can remove a participant from the stage back to subscriber status or end the live room completely.


* [ ] Unexpected socket disconnections clean up queue states gracefully without crashing the video channel.



---

## Data Isolation & Security

* [ ] Users cannot modify room states or host permissions unless authenticated as the room host/mentor.


* [ ] Backend API rejects Agora token requests for invalid or unauthorized room IDs.


* [ ] Sensitive secrets (Agora App Certificate, MongoDB URI, JWT secret) are never exposed in client bundle network requests.



---

## Responsive & Viewport Testing

Test layout integrity, navigation drawers, and touch targets across the following breakpoints:

* [ ] **Mobile (375px):** Single-column layout, bottom mobile navigation/action bar, overlay request drawer, touch hit targets $\ge 44\text{px}$.
* [ ] **Tablet (768px):** Responsive grid layout for dashboard cards, side-by-side video canvas and chat/queue panel.
* [ ] **Desktop (1440px):** Full multi-column dashboard, sticky filter sidebars, grid view for multi-participant video stage.