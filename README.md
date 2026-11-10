

# LearnHub

LearnHub is a course marketplace built with React, Express, Supabase, and MongoDB. Students can browse courses, enroll, track learning, and manage wishlists; instructors and administrators have separate management tools.

## Architecture

```text
Browser
  └── Vercel: React + Vite frontend
        ├── Supabase Auth and Postgres
        └── Render: Express REST API
              ├── Supabase Postgres (application data)
              ├── MongoDB Atlas (chat and payment records)
              ├── Razorpay (payments)
              └── Google Gemini (AI features)
```

The project currently uses Supabase and MongoDB for different features. Keep this split while deploying; consolidating databases is a separate migration, not a deployment prerequisite.

## Repository layout

```text
client/                 React/Vite web application (package: learnhub-web)
  public/
  src/
  .env.example
  package.json
server/                 Express API (package: learnhub-api)
  src/
    config/              Database and provider configuration
    controllers/         Request handlers
    middleware/          Authentication, validation, and error handling
    models/              MongoDB models
    routes/              API route definitions
    services/            Business logic and provider integrations
  .env.example
  package.json
README.md                Setup and deployment guide
```

`client` and `server` are intentional, established folder names. Keeping them avoids breaking imports and deployment root-directory settings.

## Local development

Prerequisites: Node.js 22.12+ (Node 24 LTS recommended), npm, a Supabase project, a MongoDB database, and credentials for the integrations you plan to use.

1. Install frontend and backend dependencies from their respective directories with `npm ci`.
2. Create `client/.env` from `client/.env.example` and `server/.env` from `server/.env.example`; fill in local credentials.
3. Start the API from `server/` with `npm run dev`.
4. Start the web app from `client/` with `npm run dev`.
5. Open the Vite URL shown in the terminal. The API health check is `http://localhost:5000/api/health`.

The frontend uses `VITE_API_URL` to select the API. For local development, use `http://localhost:5000/api`.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_API_URL` | Vercel / client | Public API base URL, including `/api` |
| `VITE_SUPABASE_URL` | Vercel / client | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Vercel / client | Supabase publishable key; protect data with Supabase RLS |
| `PORT` | Render / server | HTTP port; the host may set this automatically |
| `CLIENT_URL` | Render / server | Exact deployed frontend origin for CORS |
| `NODE_ENV` | Render / server | Set to `production` |
| `SUPABASE_URL` | Render / server | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Render / server | Supabase key used by the API |
| `MONGODB_URI` | Render / server | MongoDB Atlas connection string |
| `GEMINI_API_KEY` | Render / server | Server-only Gemini credential |
| `RAZORPAY_KEY_ID` | Render / server | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Render / server | Server-only Razorpay secret |

Never put private keys, database passwords, or payment secrets in a `VITE_` variable. Vite variables are intended for browser code. Do not commit `.env` files; use the checked-in example files as templates and configure production values in the hosting providers' secret settings.

## Deployment

Recommended split hosting for this repository:

| Component | Service | Configuration |
|---|---|---|
| Frontend | Vercel | Create a project from this repository with root directory `client`; use `npm ci`, `npm run build`, and output directory `dist` |
| API | Render Web Service | Use the checked-in `render.yaml` blueprint; configure its secret environment variables in Render |
| Authentication and relational data | Supabase | Keep the current project; verify production URL settings and row-level security policies |
| Chat and payment records | MongoDB Atlas | Keep the current MongoDB models; use a production database and restrict network access |

### Release order

1. Create production Supabase and MongoDB Atlas resources, and verify backups, access controls, and database policies.
2. Deploy the API on Render. Set `NODE_ENV`, `CLIENT_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `MONGODB_URI`, `GEMINI_API_KEY`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET` in the Render dashboard. Set `CLIENT_URL` to the final Vercel origin.
3. Verify `https://<render-service>/api/health` returns a healthy response.
4. Deploy the frontend on Vercel with `VITE_API_URL=https://<render-service>/api`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY`. Set the Vercel root directory to `client`. The browser receives the public Razorpay key ID from the API when required; keep the Razorpay secret exclusively on the server.
5. Add the deployed frontend origin to Supabase Auth URL settings and confirm CORS allows that exact origin.
6. Smoke-test sign-in, course browsing, enrollment, chatbot access, and checkout using Razorpay test credentials before enabling live payment credentials.
7. Test a production build and recheck all critical flows after adding a custom domain.

Vercel and Render should be connected to the same deployment branch. Keep previews on test credentials and use production secrets only in production environments. Render free instances may sleep; use an always-on service for production payment and user flows.

## Validation

```text
Frontend build: npm --prefix client run build
Frontend lint:  npm --prefix client run lint
API health:     GET /api/health
```

The API package currently has no automated test suite configured. Add API and payment-flow tests before treating a production release as fully verified.

## Naming conventions

- Product: `LearnHub`
- Frontend package: `learnhub-web`
- API package: `learnhub-api`
- Keep source folders named `client/` and `server/`.
- Suggested production names: Supabase project `learnhub-prod` and MongoDB database `learnhub_prod`. Use separate development resources; do not rename existing cloud resources without checking their clients and data first.
