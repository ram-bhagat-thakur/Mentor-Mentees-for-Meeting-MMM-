# Production Deployment

The production deployment uses Vercel for the React client, Render for the
Express and Socket.IO server, and MongoDB Atlas for persistence. The repository
contains the Vercel and Render build definitions; provider credentials and
secret values must be entered in provider dashboards and must never be committed.

## Render API and Socket.IO service

Create a Render web service from the repository root and use the settings in
`render.yaml`. The service installs the root npm workspaces, runs backend syntax
checks, and starts `@mmm/server`. Render supplies `PORT`; do not hardcode a port.
Set these variables in the Render dashboard:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` (also defined in `render.yaml`) |
| `CLIENT_URL` | `https://mentor-bridge-seven.vercel.app` (HTTPS origin only; the server removes a trailing slash) |
| `MONGODB_URI` | MongoDB Atlas connection URI for the production database |
| `JWT_SECRET` | A randomly generated secret with at least 32 bytes |
| `AGORA_APP_ID` | App ID for the production Agora project |
| `AGORA_APP_CERTIFICATE` | Matching Agora App Certificate; keep server-side only |

Configure Atlas network access for the Render service's outbound IP addresses,
or use the provider-supported restricted networking option. Avoid unrestricted
database access where a narrower allowlist is available. The service validates
production configuration and establishes MongoDB connectivity before it starts
serving health checks or application traffic.

## Vercel frontend

Import the repository into Vercel with the repository root as the project root.
The checked-in `vercel.json` configures the client build, output directory, and
SPA route fallback. Add these variables to the **Production** environment in
Vercel:

| Variable | Value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://<render-service-host>/api` |
| `VITE_SOCKET_URL` | `https://<render-service-host>` (origin only, no `/api`) |
| `VITE_AGORA_APP_ID` | The same public Agora App ID configured on Render |

Vite embeds `VITE_` variables into the public browser bundle. Never add
`MONGODB_URI`, `JWT_SECRET`, or `AGORA_APP_CERTIFICATE` to Vercel. Production
Vercel builds reject missing or malformed client URLs and missing Agora App IDs.
Preview deployments are not automatically allowed by the single-origin
production CORS policy; configure an intentional preview origin separately
before testing previews.

After both services are deployed, set Render's `CLIENT_URL` to the final Vercel
production origin and redeploy or restart the Render service.

## Production smoke test

1. Open `https://<render-service-host>/api/health` and confirm the response has
   `status: "ok"` and `database: "connected"`.
   The API root `/` returns service information and links to this health route.
2. Register and log in with a test institutional account.
3. Search mentors by skill and verify matching results.
4. Open two authenticated browser sessions. Create a live room in one and
   confirm the other receives the `feed:status_change` update.
5. Join the room from the mentee session and verify an Agora RTC token is
   issued with audience permissions.
6. Request the stage, approve the request as the room host, and confirm the
   mentee receives publisher permissions and can publish media.
7. Check browser console and network panels for CORS, WebSocket, API, and Agora
   errors; test room leave and reconnection behavior.

The deployment is not considered verified until these checks have been run
against the production URLs. This repository does not contain provider
credentials or production URLs.
