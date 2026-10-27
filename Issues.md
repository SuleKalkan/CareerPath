Design Reference: https://www.figma.com/make/EdSAI5pI6P4PywHSQlehlf/CareerPath?t=g7UT8L5OiUuh3Z8T-0 
Issue 1 - "Preparing and organizing"(James)

As a student, I want to be able to organize the skills I need to learn on a roadmap
so I am prepared for the cybersecurity position I want.

Requirements:
Roadmap that a user can interact with
Adding skills to the roadmap
Seeing how those skills match up to the desired position

Acceptance Criteria:
[]User can add/remove tasks
[]User's skill match updates with new skills/less skills.
    
Tasks:
[]Implement roadmap add/remove feature
[]Modify skill match feature to update on skills.
[]Logic for skill matching needs work.

Issue 2 — “Exploring career options” (Jane)

As a student interested in AI, I want to explore and compare related careers so I can decide which direction fits my interests.

Requirements:
Career information for machine learning engineering and AI research
Descriptions of each role’s responsibilities, skills, and education expectations
Ability to view preparation steps for each career

Acceptance Criteria:
[] User can find and view both career options.
[] User can identify differences in responsibilities, required skills, and education expectations.
[] User can select a career and view its recommended preparation steps.

Tasks:
[] Implement career browsing and career detail views.
[] Add career information for machine learning engineering and AI research.
[] Present career information in a consistent format for comparison.
[] Connect each career to its recommended preparation steps.

Issue 3 — “Uploading completed courses” (Lia)

As a transfer student, I want to upload my completed courses so I can update my roadmap without entering each course individually.

Requirements:
Upload feature for a course list or transcript
Review of extracted courses before saving
Roadmap updates based on confirmed completed courses

Acceptance Criteria:
[] User can upload a supported file, with accepted formats shown.
[] User can review, correct, or remove extracted courses before confirming.
[] Confirmed courses are added without creating duplicate entries.
[] Roadmap reflects recognized completed coursework.
[] Unrecognized courses are flagged for review.
[] An unsupported or unreadable file displays a clear error message.

Tasks:
[] Define supported file formats and implement file upload.
[] Extract course information from uploaded files.
[] Build a review and confirmation screen.
[] Add duplicate detection and flag unrecognized courses.
[] Connect confirmed courses to roadmap progress.
[] Implement upload validation and error messages.

Issue 4 — “Finding a career direction” (Alex)

As a student unsure which technology career to pursue, I want to see roles related to my interests and coursework so I can choose a direction and understand how to prepare.

Requirements:
Profile fields for interests and completed coursework
Career recommendations based on the user’s background
Skill gaps and suggested next steps for a selected career

Acceptance Criteria:
[] User can enter and update their interests and coursework.
[] User can view relevant career recommendations and why they match.
[] User can select a career and see skills they still need to develop.
[] User can add a suggested preparation activity to their roadmap.
[] Added activities remain available when the user returns to the roadmap.

Tasks:
[] Implement profile fields for interests and coursework.
[] Implement career recommendation logic.
[] Display the reasons for each recommendation.
[] Connect selected careers to skill-gap information.
[] Connect suggested activities to the roadmap add feature.
[] Save profile information and roadmap activities.