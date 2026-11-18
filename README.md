# PrepPro

A placement and interview prep platform for students.

- **Practice tests:** untimed tests with explanations and feedback after each one.
- **Assessments:** scored tests. The score is added to your points.
- **AI mock interviews:** chat with an AI interviewer, write and run code in the browser, and get a score at the end.
- **Dashboard and insights:** your stats, accuracy per category, score trend, and the topics to work on.
- **Leaderboard:** everyone ranked by points.

Only assessments and interviews give points. Practice tests do not.

## Tech stack

| Part | Tech |
|---|---|
| Frontend | Next.js 15, React 19, Tailwind CSS, shadcn/ui, Recharts, Monaco editor |
| Backend | Node.js, Express, TypeScript, Zod (validation), JWT (auth) |
| Database | PostgreSQL 16 with Prisma ORM |
| Cache | Redis 7, used for the leaderboard (sorted set) and a 5 minute stats cache |
| AI | Google Gemini, for questions, feedback, the interviewer and interview scores |
| Code runner | Judge0, so user code never runs on our server |

## Project structure

```
PrepPro/
├── backend/
│   ├── docker-compose.yml   PostgreSQL + Redis for local development
│   ├── prisma/              schema.prisma, migrations, seed.ts, questions.json
│   └── src/
│       ├── config/          env, prisma, redis
│       ├── middleware/      auth, validate, errorHandler
│       ├── routes/          URL → controller
│       ├── controllers/     read the request, send the response
│       ├── services/        the actual logic (tests, interviews, AI, leaderboard, ...)
│       ├── validators/      Zod schemas for request bodies
│       └── utils/
└── frontend/
    └── src/
        ├── app/             pages (Next.js app router)
        ├── components/      UI pieces, grouped by feature
        ├── hooks/
        └── lib/api/         one file per backend module
```

## Setup

You need **Node.js 20+** and **Docker**.

### 1. Start PostgreSQL and Redis

```bash
cd backend
docker compose up -d
```

PostgreSQL runs on port **5433** and Redis on port **6380**, not the usual 5432 and 6379. That way they don't clash with a PostgreSQL or Redis you may already have installed (for example inside WSL).

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env        # then set JWT_SECRET (and GEMINI_API_KEY if you have one)
npm run db:migrate          # creates the tables
npm run db:seed             # adds the starter question bank
npm run dev                 # http://localhost:5000
```

Check that it works by opening http://localhost:5000/health. It should return `{"status":"ok"}`.

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev                 # http://localhost:3000
```

Open http://localhost:3000, sign up, and fill in your profile.

### Without a Gemini key

The app still works without one:
- Tests use the seeded question bank. A category with few bank questions gives a shorter test.
- Feedback and the interviewer use simple built-in fallbacks.
- Interview scores are only a basic estimate.

Get a free key at https://aistudio.google.com/apikey and set `GEMINI_API_KEY` for the real experience.

## Environment variables

### `backend/.env`

| Variable | Required | Default | What it is |
|---|---|---|---|
| `DATABASE_URL` | yes | | PostgreSQL connection string |
| `REDIS_URL` | yes | | Redis connection string |
| `JWT_SECRET` | yes | | Secret for signing login tokens. Use a long random string |
| `PORT` | no | `5000` | Backend port |
| `CORS_ORIGIN` | no | `http://localhost:3000` | Frontend URL(s) allowed to call the API, comma separated |
| `GEMINI_API_KEY` | no | empty | Gemini API key. Without it, fallbacks are used |
| `GEMINI_MODEL` | no | `gemini-3.1-flash-lite` | Gemini model name |
| `JUDGE0_URL` | no | `https://ce.judge0.com` | Judge0 server for running code. The public one needs no key |
| `JUDGE0_API_KEY` | no | empty | Only for the RapidAPI version of Judge0 (`https://judge0-ce.p.rapidapi.com`) |

The backend refuses to start if a required variable is missing.

### `frontend/.env`

| Variable | Default | What it is |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | Where the backend API runs |

## Scripts

| Folder | Command | What it does |
|---|---|---|
| backend | `npm run dev` | Start the API and restart on changes |
| backend | `npm run build` / `npm start` | Compile to `dist/` / run the compiled build |
| backend | `npm run db:migrate` | Apply database migrations |
| backend | `npm run db:seed` | Add the question bank (safe to run again) |
| backend | `npm run db:studio` | Browse the database in Prisma Studio |
| backend | `npm test` | Run the API tests (needs PostgreSQL + Redis running) |
| frontend | `npm run dev` | Start the website |
| frontend | `npm run build` / `npm start` | Production build / run it |
| frontend | `npm run lint` | Run ESLint |

## API

Every endpoint is under `/api`. Everything except signup and login needs the header `Authorization: Bearer <token>`. Without a valid token you get `401`.

Errors always look like `{ "message": "..." }`. Validation errors also include `errors: [{ field, message }]`.

| Module | Method | Endpoint | What it does |
|---|---|---|---|
| Auth | POST | `/auth/signup` | `{ name, email, password }` → `{ token, user }` |
| | POST | `/auth/login` | `{ email, password }` → `{ token, user }` |
| | GET | `/auth/me` | The logged-in user |
| User | PUT | `/users/me` | Update profile: `name, bio, college, gradYear, targetRole, avatarUrl` |
| | PUT | `/users/me/password` | `{ oldPassword, newPassword }` |
| | GET | `/users/:id` | Someone's public profile (no email) |
| Tests | GET | `/tests/categories` | Categories and difficulties |
| | POST | `/tests` | `{ mode: PRACTICE \| ASSESSMENT, category, difficulty, count }` → a new test |
| | GET | `/tests?mode=&page=&limit=` | My tests, newest first |
| | GET | `/tests/:id` | One test. Answers are hidden until it is submitted |
| | POST | `/tests/:id/submit` | `{ answers: [{ questionId, answer: string[] }] }` → score, feedback, correct answers |
| Interviews | POST | `/interviews` | `{ role, level, type, language, company? }` → the interview and the first AI message |
| | GET | `/interviews?page=&limit=` | My interviews |
| | GET | `/interviews/:id` | One interview with all its messages |
| | POST | `/interviews/:id/messages` | `{ content, code?, language? }` → my message and the AI reply |
| | POST | `/interviews/:id/run-code` | `{ code, language, stdin? }` → `{ status, stdout, stderr, time }` (not saved) |
| | POST | `/interviews/:id/end` | Scores the interview and adds the points |
| Dashboard | GET | `/dashboard` | Points, rank, tests and interviews completed, average score, recent activity |
| | GET | `/insights` | Accuracy per category, strengths, weaknesses, score trend, interview averages |
| Leaderboard | GET | `/leaderboard?limit=50` | `{ top: [{ rank, id, name, avatarUrl, college, points }], me: { rank, points } }` |

Supported code languages: `javascript`, `python`, `java` (the class must be called `Main`) and `cpp`.

## Tests and CI

The backend has API tests in `backend/test/`. They use Node's built-in test runner. Each test starts the real app, calls it over HTTP and checks the answers. Gemini is turned off in tests, so the results are always the same. Every user a test creates is deleted afterwards.

To run them, start Docker and seed the database, then run `npm test` in `backend/`. It is best to point them at a separate database so your own data stays clean:

```bash
cd backend
docker exec preppro-postgres psql -U preppro -c "CREATE DATABASE preppro_test"
export DATABASE_URL=postgresql://preppro:preppro@localhost:5433/preppro_test
npx prisma migrate deploy && npx prisma db seed
npm test
```

**CI** (`.github/workflows/ci.yml`) runs on GitHub Actions for every pull request and every push to `main`:

| Job | Checks |
|---|---|
| Backend | `npm ci` → migrations apply on an empty PostgreSQL → seed → `tsc` build → API tests (with real PostgreSQL + Redis) |
| Frontend | `npm ci` → ESLint → `next build` (includes the type check) |

## How a few things work

- **Points:** finishing an assessment adds its score (0–100). Ending an interview adds its overall score. Both are saved in PostgreSQL (`User.totalPoints`) first, then copied to Redis.
- **Leaderboard:** a Redis sorted set. If it is missing (Redis restarted or flushed), it is rebuilt from PostgreSQL. If Redis is down, the leaderboard is read straight from PostgreSQL.
- **Stats cache:** dashboard and insights are cached in Redis for 5 minutes per user. The cache is cleared when you finish a test or an interview. Your rank is never cached.
- **AI questions** are saved to the `Question` table, so the question bank grows over time and works as a fallback when Gemini is down.
