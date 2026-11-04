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
