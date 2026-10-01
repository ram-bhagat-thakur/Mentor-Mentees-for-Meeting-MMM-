# Security Requirements

---

## Authentication & Session Management

* **Protected Routes:** All private REST endpoints (`/api/rooms/create`, `/api/mentors/me`) and Socket.io namespaces require a valid JWT token passed via the `Authorization: Bearer <token>` header or handshake query parameters.


* **Token Invalidation & Expiry:** Short-lived access JWT tokens (e.g., 24-hour expiration) signed with strong secret keys (`JWT_SECRET`).


* **Password Security:** All user passwords must be salted and hashed using `bcrypt` (minimum 10 salt rounds) before saving to MongoDB Atlas; plaintext passwords must never be logged or stored.

---

## Authorization & Role-Based Access Control (RBAC)

* **Ownership Verification:** Users can only modify resources they own. Backend API controllers must verify `req.user.id === room.hostId` before allowing actions like starting, stopping, or managing participant permissions in a room.


* **Role Enforcement:** Restrict privileged endpoints (e.g., approving stage join requests, creating official alumni sessions) to verified roles (`mentor` or `verified_alumni`).


* **Socket Event Authorization:** Verify the identity and permissions of the socket connection before processing state modifications (`room:approve_stage`, `room:kick`).



---

## Secrets Management & Environment Isolation

* **Zero Client-Side Exposure:** Never expose sensitive secrets—such as `AGORA_APP_CERTIFICATE`, `MONGODB_URI`, or `JWT_SECRET`—to client-side bundles or public GitHub repositories.


* **Strict Key Separation:** Only public-facing keys (e.g., `REACT_APP_AGORA_APP_ID`) are permitted in client environment variables.


* **Agora Token Generation:** Agora WebRTC RTC tokens must be generated on the backend server on-demand after validating client permissions.



---

## Input Validation & Data Sanitization

* **Request Validation:** Validate all REST API request bodies, URL parameters, and Socket.io event payloads using validation middleware (e.g., `express-validator` or `zod`).
* **NoSQL Injection Prevention:** Sanitize all query inputs to prevent MongoDB operator injection attacks (e.g., sanitizing `$gt`, `$ne`, or `$regex` inputs).
* **XSS Protection:** Sanitize user-generated text inputs (bios, room titles, chat messages) before rendering them in the DOM to prevent Cross-Site Scripting (XSS).

---

## API Security & Rate Limiting

* **CORS Policy:** Restrict Cross-Origin Resource Sharing (CORS) on Express endpoints and Socket.io gateways to explicitly whitelisted client origins (e.g., production Vercel deployment URL).


* **Rate Limiting:** Implement strict rate limiters on sensitive endpoints (`/api/auth/login`, `/api/auth/register`, `/api/rooms/agora-token`) to mitigate brute-force and Denial-of-Service (DoS) attempts.


* **Security Headers:** Use `helmet` middleware on the Express backend to set secure HTTP response headers (Content Security Policy, X-Frame-Options, Strict-Transport-Security).

---

## File Uploads & Media Handling

* **File Type Whitelisting:** Allow only specific MIME types (e.g., `image/jpeg`, `image/png`, `application/pdf` for resumes/profile photos).
* **File Size Limits:** Restrict maximum payload sizes (e.g., maximum 5 MB for profile pictures, 10 MB for resumes) at the middleware layer (`multer`).
* **Filename Sanitization:** Strip original file paths and generate randomized UUID filenames prior to cloud storage upload to prevent directory traversal attacks.