# CareerPath

CareerPath is a university-focused job board and career-planning app for undergraduate students. Students can explore partner opportunities, compare roles against their skills, save jobs, and plan activities toward their career goals.

## Install

Install [Node.js](https://nodejs.org/) and npm, then install the project dependencies from the repository root:

```bash
npm install
```

## Run locally

Start the Vite development server:

```bash
npm run dev
```

Open the local URL printed in the terminal (the configured default is `http://localhost:8443`; set `PORT` to use a different port).

## Local PostgreSQL database

The Prisma schema and initial migration define the PostgreSQL data model. To create a local development/demo database, install PostgreSQL (including `psql` and `createdb`), create a database, and apply the migration and synthetic seed data from the repository root in PowerShell:

```powershell
createdb careerpath_dev
$env:DATABASE_URL = "postgresql://postgres:<password>@localhost:5432/careerpath_dev"
psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f prisma\migrations\20261110154000_initial_schema\migration.sql
psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f prisma\seed.sql
```

Replace `<password>` with the password configured for your local PostgreSQL role. The migration is intended to run once on a new database; the seed can be run repeatedly. The seed contains fictional students, careers, courses, employers, and job listings. It covers job matching, saved jobs, roadmap progress, completed courses, transcript review (recognized and unrecognized rows), and a failed import. The demo accounts use `@example.test` addresses and have no passwords because this schema does not implement authentication.

The seeded Cybersecurity Analyst Intern listing has five required skills. Maya starts with Python in her profile and Networking as a not-started roadmap activity, so her match is 20%. Completing that activity gives her Networking and raises the match to 40%. These database records are for development and demonstration only; the current Vite UI still uses its own in-memory sample data and is not connected to a database/API.

## Neon connection

The app is linked to the Neon project [`green-flower-30510503`](https://console.neon.tech/app/projects/green-flower-30510503/). Its `production` branch now has the initial Prisma migration applied and the synthetic demo seed loaded. Neon CLI stores its connection settings in the ignored `.env.local` file: `DATABASE_URL` is the pooled connection, and `DATABASE_URL_UNPOOLED` is the direct connection for Prisma migrations. Keep these values private; do not commit them or expose them through a `VITE_` variable. Use the unpooled connection when applying future migrations. The current app is a browser-only Vite frontend with no API/server, so it must not connect directly to PostgreSQL from client code; the database is provisioned but not yet wired to the UI.

## Implemented feature: interactive career roadmap

The roadmap lets students add and remove activities, track them from **Not started** through **In progress** to **Completed**, and view progress toward their goal. Skill coverage distinguishes skills already in a profile, completed through the roadmap, planned in an activity, or still needing an activity. Job match percentages update when profile skills or completed roadmap skills change. Missing skills on a job can also be added to the roadmap.

## Test the feature

There is no automated test script in the project yet. To check the feature manually:

1. Run the app locally and open **Explore jobs**.
2. Open **Cybersecurity Analyst Intern** and note its match percentage and missing skills.
3. Use **Add** beside a missing skill, then open **My roadmap**. Expand upcoming activities if needed and open the new skill activity.
4. Mark it **In progress** and check that the skill is shown as planned in the roadmap’s skill coverage. Open it again and mark it **Completed**; the coverage should update and the job match should increase.
5. Remove the completed activity and confirm the roadmap and skill coverage update. The job match should decrease if the skill is not also in your profile.
6. Run the production build as a separate check:

   ```bash
   npm run build
   ```
