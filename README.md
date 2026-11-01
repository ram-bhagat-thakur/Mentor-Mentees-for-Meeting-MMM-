# MMM (Mentors Meet Mentees)

## Development Setup

Requirements: Node.js 22 or newer and npm 10 or newer.

Install dependencies from the repository root:

```sh
npm install
```

Start the React client and Express API together:

```sh
npm run dev
```

The client runs at <http://127.0.0.1:5173> and the API at <http://127.0.0.1:5000>. Check the API with `GET /api/health`.

Run the configured checks:

```sh
npm run lint
npm run check
npm run build
```

Tailwind configuration and design tokens are scheduled for TASK-002.

## Production Deployment

Deployment configuration and provider environment-variable instructions are
available in [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md). Configure secrets in
the Render dashboard and public `VITE_` settings in Vercel; do not commit them.
