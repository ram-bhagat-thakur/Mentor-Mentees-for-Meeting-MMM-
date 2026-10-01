# Product Requirements Document (PRD)

---

## Product

**MMM (Mentors Meet Mentees)**

---

## Problem

* **Information Overload & Contradictory Content:** Students face analysis paralysis on platforms like YouTube due to outdated, conflicting, and generalized career advice.


* **High Friction in Cold Outreach:** Networking on platforms like LinkedIn feels formal and cold; cold messaging professionals yields low response rates ($<10\%$) for students seeking immediate guidance.


* **Disconnected University Networks:** Universities and placement cells struggle to maintain active, structured alumni engagement, leaving current students disconnected from real-time industry requirements and placement preparation.



---

## Target Users

* **Mentees:** College students (BTech, BCA, BSc CS, Business) seeking instant career clarity, portfolio reviews, and mentorship.


* **Mentors:** Verified alumni and industry professionals looking to give back to their alma mater or monetize specialized 1-on-1 consultations.


* **Institutional Users:** University placement cells seeking a SaaS platform to track, host, and optimize alumni-student engagement.



---

## Goal

Create a centralized, real-time, video-first academic and professional networking platform that connects students with verified alumni and industry professionals via drop-in micro-webinars and 1-on-1 consultations to eliminate career confusion.

---

## Core Features

1. **Authentication & Profile Management**
* Multi-role onboarding (Mentee vs. Mentor).


* Email/OAuth and institutional domain verification (`.edu` / `.ac.in`) with LinkedIn integration for verified badges.


* Rich mentor profile creation (skills, company, hourly rate, tags, bio).




2. **Live Micro-Webinar Dashboard**
* Dynamic homepage showing real-time ongoing video/audio drop-in rooms.


* Real-time UI feed updates using WebSockets.


* Alma mater highlighting to prioritize live rooms hosted by alumni from the user's campus.




3. **Interactive Request Queue & Video Call Engine**
* Multi-party WebRTC interactive video/audio streams.


* Real-time "Request to Join" button for mentees.


* Mentor host queue control (approve/reject candidates, toggle mic/video permissions).




4. **Search & Discovery Engine**
* Multi-parametric search by exact skills, job roles, target companies, or shared alma mater.


* Campus-specific alumni directory filtering.




5. **1-on-1 Private Consultation Booking**
* Direct booking flow for focused paid or free mock interviews, resume reviews, and portfolio surgeries.





---

## MVP Scope

* User signup & login (JWT auth with role selection).


* Basic profile creation & setup for mentors and mentees.


* Dashboard displaying live ongoing rooms with category tags.


* Mentor ability to create and end a live video room.


* Video/audio streaming inside live rooms powered by Agora SDK.


* Mentee ability to click "Request to Join" a live room.


* Mentor ability to view pending requests and approve/deny mentees into the stage call via Socket.io signaling.


* Basic text/skill search for finding mentors.



---

## Out of Scope (Initial Phase)

* Integrated payment gateway processing (commission calculations executed manually/external during beta).


* White-labeled B2B SaaS University Placement analytics dashboard.


* Native mobile applications (iOS / Android).


* Automated AI-based session transcriptions or AI summary generators.


* Session video recording archives and cloud playback storage.



---

## Success Criteria

A user should be able to:

1. Register an account as either a Mentee or a Mentor.


2. Complete profile onboarding with skills and college details.


3. Search for mentors filtered by skills or shared alma mater.


4. Host a live video/audio room (Mentor).


5. View active, live rooms on the central dashboard (Mentee).


6. Send a live "Request to Join" while inside an active room (Mentee).


7. Accept a mentee's join request to bring them onto the stage video call (Mentor).