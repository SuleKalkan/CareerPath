# Testing: Roadmap & Skill Match (Issue #1)

**Tested by:** Megha Ranjani Saravanan
**Date tested:** November 4, 2026
**Branch tested:** issueOneBranch
**How to run:** `npm install`, then `npm run dev`, then open http://localhost:8443/

## Acceptance Criterion 1: User can add/remove tasks

- Roadmap before I started: 4 activities, 1 of 4 complete (25%). Skill coverage: Python "In profile", all other skills showed "Add".
- I added this item: "Networking Basics" (category: Networking, duration: 4 weeks, description: "Learn the fundamentals of computer networking").
- - Did it appear on the roadmap? Yes. The total went from 4 to 5 activities.
- I removed it. Did it disappear? Yes. The activity was removed from the roadmap and a notification confirmed the removal.
- Also tested adding a skill with the "Add" button in Skill coverage. It created a new activity on the roadmap and the skill showed "Planned". Removing that activity worked as well.
- Result: Pass

## Acceptance Criterion 2: Skill match updates with new skills/less skills

- Starting skill coverage: Networking "Add", Linux "Add", Python "In profile", SIEM "Add", Risk analysis "Add". Roadmap progress: 25%.
- After adding the Networking activity (not yet complete): Networking showed "Planned" in Skill coverage.
- After marking the activity complete: Networking changed to "Completed" in Skill coverage. The roadmap progress changed from 25% (1 of 4) to 60% (3 of 5).
- After removing the activity: the skill went back to "Add" and the roadmap progress went back to 25%.
- Result: Pass

## Other Behavior Observed

- Each time an activity is added or removed, a notification appears confirming the action ("activity added to the roadmap" or "activity removed from the roadmap").

## Edge Cases

- Added the same activity twice (using "Add activity"): the app accepted both and recorded two separate entries, with no warning or duplicate check.
- Refreshed the page: all changes were lost and the roadmap went back to its starting state (4 activities, 1 of 4 complete, 25%).

## Notes / Bugs Found

- Duplicate activities are allowed. Adding the same activity twice creates two entries and no warning is shown. This could inflate the activity count and progress percentage. It does not break the acceptance criteria for Issue #1, but a duplicate check would be a good improvement.
- Roadmap changes are not saved. A page refresh resets everything. Issue #1 does not require persistence, but Issue #4 does ("Added activities remain available when the user returns to the roadmap"), so this is planned for later work.
- The app shows a notification confirming each activity added or removed, which is helpful feedback.
