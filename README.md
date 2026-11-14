# CareerPath

CareerPath is a university-focused job board and career-planning app for undergraduate students. Students can explore partner opportunities, compare roles against their skills, save jobs, and plan activities toward their career goals.

## Install

Install [Node.js](https://nodejs.org/) and npm, then install the project dependencies from the repository root:

```bash
npm install
```

## Run locally

Configure the API and start both services in separate terminals. Copy `.env.example` to `.env.local`, then set the pooled `DATABASE_URL` and direct `DATABASE_URL_UNPOOLED` values from Neon. Keep `.env.local` private and untracked.

```bash
npm run dev:api
```

In another terminal:

```bash
npm run dev
```

Open the local URL printed by Vite (the configured default is `http://localhost:8443`; set `PORT` to use a different port). Vite proxies `/api` requests to the Node API on `127.0.0.1:3001`.

The API reads `.env.local` itself. Prisma commands also load that file and use `DATABASE_URL_UNPOOLED` for migrations:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

These database commands modify the selected database. Use them only when you intend to generate the client, apply migrations, or load the synthetic demo data.

## Local PostgreSQL database

The Prisma schema and initial migration define the PostgreSQL data model. To create a local development/demo database, install PostgreSQL (including `psql` and `createdb`), create a database, and apply the migration and synthetic seed data from the repository root in PowerShell:

```powershell
createdb careerpath_dev
$env:DATABASE_URL = "postgresql://postgres:<password>@localhost:5432/careerpath_dev"
psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f prisma\migrations\20261110154000_initial_schema\migration.sql
psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f prisma\seed.sql
```

Replace `<password>` with the password configured for your local PostgreSQL role. The migration is intended to run once on a new database; the seed can be run repeatedly. The seed contains fictional students, careers, courses, employers, and job listings. It covers job matching, saved jobs, roadmap progress, completed courses, transcript review (recognized and unrecognized rows), and a failed import. The demo accounts use `@example.test` addresses and have no passwords because this schema does not implement authentication.

The seeded Cybersecurity Analyst Intern listing has five required skills. Maya starts with Python in her profile and Networking as a not-started roadmap activity, so her match is 20%. Completing that activity gives her Networking and raises the match to 40%. These database records are for development and demonstration only.

## Neon connection

The app is linked to the Neon project [`green-flower-30510503`](https://console.neon.tech/app/projects/green-flower-30510503/). Its `production` branch has the initial Prisma migration applied and the synthetic demo seed loaded. `DATABASE_URL` is the pooled connection for API queries, and `DATABASE_URL_UNPOOLED` is the direct connection for Prisma migrations. Keep both values private; never commit them or expose them through a `VITE_` variable.

The API currently serves the seeded Jordan Lee demo account (`DEMO_USER_ID` in `.env.local`). It persists job saves, profile skills, and roadmap activity changes. Transcript/resume uploads remain demo placeholders and are not uploaded or persisted. This API has no authentication and is loopback-only by default; it refuses to start with `NODE_ENV=production`. Do not expose it publicly or deploy it until authentication and authorization have been implemented.

## Implemented feature: interactive career roadmap

The roadmap lets students add and remove activities, track them from **Not started** through **In progress** to **Completed**, and view progress toward their goal. Skill coverage distinguishes skills already in a profile, completed through the roadmap, planned in an activity, or still needing an activity. Job match percentages update when profile skills or completed roadmap skills change. Missing skills on a job can also be added to the roadmap.

## Test the feature

There is no automated test script in the project yet. To check the roadmap integration manually:

1. Start the API and frontend as described above, then open **Explore jobs**.
2. Open a job and note its match percentage and missing skills.
3. Use **Add** beside a missing skill, then open **My roadmap**. Expand upcoming activities if needed and open the new skill activity.
4. Mark it **In progress** and check that the skill is shown as planned in the roadmap’s skill coverage. Open it again and mark it **Completed**; the coverage should update and the job match should increase.
5. Remove the completed activity and confirm the roadmap and skill coverage update. The job match should decrease if the skill is not also in your profile.
6. Refresh the page and verify the saved jobs, profile skills, and roadmap changes are still present.
7. Run the production build as a separate check:

   ```bash
   npm run build
   ```
