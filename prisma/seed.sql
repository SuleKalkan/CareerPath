-- Synthetic CareerPath MVP data for local development and demonstrations.
-- Safe to run repeatedly against a database created from the initial migration.
BEGIN;

INSERT INTO users (id, email, display_name) VALUES
  ('10000000-0000-4000-8000-000000000001', 'maya.thompson@example.test', 'Maya Thompson'),
  ('10000000-0000-4000-8000-000000000002', 'jordan.lee@example.test', 'Jordan Lee')
ON CONFLICT DO NOTHING;

INSERT INTO careers (id, title, normalized_title, description, responsibilities, education_expectations) VALUES
  (
    '20000000-0000-4000-8000-000000000001',
    'Cybersecurity Analyst',
    'cybersecurity analyst',
    'Monitor systems, investigate security events, and help organizations reduce information security risk.',
    ARRAY['Review security alerts', 'Investigate suspicious activity', 'Document security findings'],
    'A bachelor''s degree in cybersecurity, computer science, or a related field is commonly expected for entry-level roles.'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'Software Engineer',
    'software engineer',
    'Design, build, test, and maintain software in collaboration with product and engineering teams.',
    ARRAY['Develop and review software', 'Write automated tests', 'Collaborate on technical designs'],
    'A bachelor''s degree in computer science or equivalent practical experience is commonly expected.'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'Data Analyst',
    'data analyst',
    'Turn structured data into useful reporting and insights for organizational decision-making.',
    ARRAY['Prepare datasets', 'Build dashboards', 'Communicate findings'],
    'Coursework or a degree in analytics, statistics, business, or a related field is commonly expected.'
  )
ON CONFLICT DO NOTHING;

INSERT INTO skills (id, name, normalized_name, description) VALUES
  ('30000000-0000-4000-8000-000000000001', 'Networking', 'networking', 'Understand network protocols, traffic, and common network services.'),
  ('30000000-0000-4000-8000-000000000002', 'Linux', 'linux', 'Use Linux systems, command-line tools, and basic administration.'),
  ('30000000-0000-4000-8000-000000000003', 'Python', 'python', 'Write scripts and applications using Python.'),
  ('30000000-0000-4000-8000-000000000004', 'SIEM', 'siem', 'Review and investigate security information and event management alerts.'),
  ('30000000-0000-4000-8000-000000000005', 'Risk analysis', 'risk analysis', 'Identify, assess, and communicate operational and security risks.'),
  ('30000000-0000-4000-8000-000000000006', 'React', 'react', 'Build interactive user interfaces with React.'),
  ('30000000-0000-4000-8000-000000000007', 'Git', 'git', 'Track source changes and collaborate with version control.'),
  ('30000000-0000-4000-8000-000000000008', 'Data structures', 'data structures', 'Select and implement common data structures and algorithms.'),
  ('30000000-0000-4000-8000-000000000009', 'SQL', 'sql', 'Query and update relational databases using SQL.'),
  ('30000000-0000-4000-8000-000000000010', 'AWS Cloud', 'aws cloud', 'Work with foundational cloud infrastructure concepts and AWS services.'),
  ('30000000-0000-4000-8000-000000000011', 'Excel', 'excel', 'Organize, analyze, and present data in spreadsheets.'),
  ('30000000-0000-4000-8000-000000000012', 'Statistics', 'statistics', 'Apply descriptive statistics and interpret analytical results.'),
  ('30000000-0000-4000-8000-000000000013', 'Tableau', 'tableau', 'Create and share interactive data visualizations in Tableau.'),
  ('30000000-0000-4000-8000-000000000014', 'Docker', 'docker', 'Build and run applications in containerized environments.'),
  ('30000000-0000-4000-8000-000000000015', 'Communication', 'communication', 'Explain technical information clearly to different audiences.'),
  ('30000000-0000-4000-8000-000000000016', 'Java', 'java', 'Develop applications using the Java programming language.'),
  ('30000000-0000-4000-8000-000000000017', 'Algorithms', 'algorithms', 'Analyze and implement common algorithmic approaches.')
ON CONFLICT DO NOTHING;

INSERT INTO interests (id, name, normalized_name) VALUES
  ('40000000-0000-4000-8000-000000000001', 'Cybersecurity', 'cybersecurity'),
  ('40000000-0000-4000-8000-000000000002', 'Cloud computing', 'cloud computing'),
  ('40000000-0000-4000-8000-000000000003', 'Data visualization', 'data visualization'),
  ('40000000-0000-4000-8000-000000000004', 'Full-stack development', 'full-stack development')
ON CONFLICT DO NOTHING;

INSERT INTO employers (id, name, normalized_name) VALUES
  ('50000000-0000-4000-8000-000000000001', 'Bank of America (Demo)', 'bank of america demo'),
  ('50000000-0000-4000-8000-000000000002', 'Lowe''s (Demo)', 'lowes demo'),
  ('50000000-0000-4000-8000-000000000003', 'Duke Energy (Demo)', 'duke energy demo'),
  ('50000000-0000-4000-8000-000000000004', 'Red Ventures (Demo)', 'red ventures demo'),
  ('50000000-0000-4000-8000-000000000005', 'CareerPath Sample Employer', 'careerpath sample employer')
ON CONFLICT DO NOTHING;

INSERT INTO student_profiles (id, user_id, university, college, concentration, academic_level, expected_graduation, target_career_id) VALUES
  (
    '11000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'CareerPath Demo University',
    'College of Computing',
    'Cybersecurity',
    'Junior',
    '2027-05-15',
    '20000000-0000-4000-8000-000000000001'
  ),
  (
    '11000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'CareerPath Demo University',
    'College of Computing',
    'Software Engineering',
    'Sophomore',
    '2028-05-15',
    '20000000-0000-4000-8000-000000000002'
  )
ON CONFLICT DO NOTHING;

-- Maya matches one of the cybersecurity role's five required skills (20%).
INSERT INTO student_skills (user_id, skill_id, proficiency) VALUES
  ('10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', 'INTERMEDIATE'),
  ('10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000006', 'INTERMEDIATE'),
  ('10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000007', 'INTERMEDIATE'),
  ('10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000008', 'INTERMEDIATE'),
  ('10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000016', 'BEGINNER'),
  ('10000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'INTERMEDIATE'),
  ('10000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 'BEGINNER'),
  ('10000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000003', 'INTERMEDIATE'),
  ('10000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000009', 'BEGINNER'),
  ('10000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000010', 'BEGINNER')
ON CONFLICT DO NOTHING;

INSERT INTO student_interests (user_id, interest_id) VALUES
  ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002'),
  ('10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000004'),
  ('10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002')
ON CONFLICT DO NOTHING;

INSERT INTO career_skills (career_id, skill_id, importance) VALUES
  ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 1.00),
  ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002', 1.00),
  ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', 1.00),
  ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000004', 1.00),
  ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000005', 1.00),
  ('20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000003', 1.00),
  ('20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000006', 1.00),
  ('20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000007', 1.00),
  ('20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000008', 1.00),
  ('20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000009', 1.00),
  ('20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000010', 0.80),
  ('20000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', 1.00),
  ('20000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000009', 1.00),
  ('20000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000011', 0.80),
  ('20000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000012', 1.00),
  ('20000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000013', 0.80)
ON CONFLICT DO NOTHING;

INSERT INTO career_preparation_steps (id, career_id, skill_id, title, description, category, sequence) VALUES
  ('21000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Practice networking fundamentals', 'Complete a guided lab on ports, protocols, and basic packet analysis.', 'SKILL', 1),
  ('21000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002', 'Build Linux command-line confidence', 'Practice file permissions, process inspection, and shell navigation.', 'SKILL', 2),
  ('21000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000004', 'Review sample SIEM alerts', 'Triage a small set of synthetic security events and document findings.', 'SKILL', 3),
  ('21000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000005', 'Write a basic risk assessment', 'Identify assets, threats, and mitigations for a fictional campus service.', 'SKILL', 4),
  ('21000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000001', NULL, 'Practice technical interviews', 'Complete two mock interviews and write down topics to review.', 'CAREER_PREP', 5),
  ('21000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000008', 'Review data structures', 'Solve practice problems involving arrays, maps, trees, and runtime analysis.', 'SKILL', 1),
  ('21000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000006', 'Build a React portfolio project', 'Ship a small accessible interface and document its implementation.', 'PROJECT', 2),
  ('21000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000012', 'Practice data storytelling', 'Summarize a fictional dataset and explain its limitations.', 'PROJECT', 1)
ON CONFLICT DO NOTHING;

INSERT INTO courses (id, institution_name, course_code, title, identity_key, credits) VALUES
  ('90000000-0000-4000-8000-000000000001', 'CareerPath Demo University', 'CS210', 'Data Structures', 'cs210-data-structures', 3.0),
  ('90000000-0000-4000-8000-000000000002', 'CareerPath Demo University', 'CS101', 'Introduction to Programming with Python', 'cs101-python', 3.0),
  ('90000000-0000-4000-8000-000000000003', 'CareerPath Demo University', 'IT220', 'Network Fundamentals', 'it220-network-fundamentals', 3.0),
  ('90000000-0000-4000-8000-000000000004', 'CareerPath Demo University', 'DS205', 'Applied Statistics', 'ds205-applied-statistics', 3.0)
ON CONFLICT DO NOTHING;

INSERT INTO course_skills (course_id, skill_id) VALUES
  ('90000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000008'),
  ('90000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000017'),
  ('90000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000003'),
  ('90000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001'),
  ('90000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000002'),
  ('90000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000012'),
  ('90000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000009')
ON CONFLICT DO NOTHING;

INSERT INTO course_imports (id, user_id, file_name, media_type, storage_key, status, error_message) VALUES
  ('70000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'maya-transcript-fall-2025.pdf', 'application/pdf', 'demo/maya/transcript-confirmed.pdf', 'CONFIRMED', NULL),
  ('70000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'maya-transcript-spring-2026.pdf', 'application/pdf', 'demo/maya/transcript-review.pdf', 'REVIEW_REQUIRED', NULL),
  ('70000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'jordan-transcript-unreadable.pdf', 'application/pdf', 'demo/jordan/transcript-failed.pdf', 'FAILED', 'The sample file could not be read. Upload a readable PDF or image.')
ON CONFLICT DO NOTHING;

INSERT INTO student_courses (id, user_id, course_id, source_import_id, institution_name, course_code, course_title, term, grade, deduplication_key, completion_status) VALUES
  ('91000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', 'CareerPath Demo University', 'CS210', 'Data Structures', 'Fall 2025', 'A-', 'careerpath-demo-university:cs210:fall-2025', 'COMPLETED'),
  ('91000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000001', 'CareerPath Demo University', 'CS101', 'Introduction to Programming with Python', 'Fall 2025', 'A', 'careerpath-demo-university:cs101:fall-2025', 'COMPLETED'),
  ('91000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', '90000000-0000-4000-8000-000000000003', NULL, 'CareerPath Demo University', 'IT220', 'Network Fundamentals', 'Spring 2026', NULL, 'careerpath-demo-university:it220:spring-2026', 'IN_PROGRESS')
ON CONFLICT DO NOTHING;

INSERT INTO extracted_courses (id, course_import_id, recognized_course_id, student_course_id, raw_text, institution_name, course_code, course_title, term, grade, confidence, review_status, review_note) VALUES
  ('80000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 'CS210 Data Structures A- Fall 2025 3.0 credits', 'CareerPath Demo University', 'CS210', 'Data Structures', 'Fall 2025', 'A-', 0.9920, 'CONFIRMED', 'Matched catalog course and added to academic history.'),
  ('80000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000002', 'CS101 Intro to Programming with Python A Fall 2025', 'CareerPath Demo University', 'CS101', 'Introduction to Programming with Python', 'Fall 2025', 'A', 0.9650, 'CONFIRMED', 'Matched catalog course and added to academic history.'),
  ('80000000-0000-4000-8000-000000000003', '70000000-0000-4000-8000-000000000002', '90000000-0000-4000-8000-000000000003', NULL, 'IT220 Network Fundamentals B+ Spring 2026', 'CareerPath Demo University', 'IT220', 'Network Fundamentals', 'Spring 2026', 'B+', 0.8870, 'RECOGNIZED', 'Review the extracted term and confirm whether to add this course.'),
  ('80000000-0000-4000-8000-000000000004', '70000000-0000-4000-8000-000000000002', NULL, NULL, 'Special Topics: Secure Campus Devices Spring 2026', 'CareerPath Demo University', NULL, 'Special Topics: Secure Campus Devices', 'Spring 2026', NULL, 0.5120, 'UNRECOGNIZED', 'No catalog match was found. Edit the course details or remove this row.')
ON CONFLICT DO NOTHING;

INSERT INTO roadmaps (id, user_id, career_id, title) VALUES
  ('a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Cybersecurity Analyst Roadmap'),
  ('a0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'Software Engineer Roadmap')
ON CONFLICT DO NOTHING;

INSERT INTO roadmap_activities (id, roadmap_id, preparation_step_id, skill_id, student_course_id, title, category, duration, description, status, position) VALUES
  ('a1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', NULL, '30000000-0000-4000-8000-000000000008', '91000000-0000-4000-8000-000000000001', 'Complete Data Structures', 'COURSE', 'Fall 2025', 'Build a strong foundation in algorithms and computational thinking.', 'COMPLETED', 0),
  ('a1000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', NULL, NULL, NULL, 'Build a portfolio project', 'PROJECT', '4 weeks', 'Create and document a full-stack application that solves a real problem.', 'IN_PROGRESS', 1),
  ('a1000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000005', NULL, NULL, 'Practice technical interviews', 'CAREER_PREP', '2 weeks', 'Complete two mock interviews and review common technical questions.', 'NOT_STARTED', 2),
  ('a1000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', NULL, 'Develop Networking', 'SKILL', '4 weeks', 'Learn network fundamentals through a guided lab. Mark complete to raise the cybersecurity job match from 20% to 40%.', 'NOT_STARTED', 3),
  ('a1000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000002', '21000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000008', NULL, 'Review data structures', 'SKILL', '3 weeks', 'Solve practice problems involving arrays, maps, trees, and runtime analysis.', 'IN_PROGRESS', 0),
  ('a1000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000002', '21000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000006', NULL, 'Build a React portfolio project', 'PROJECT', '4 weeks', 'Ship a small accessible interface and document its implementation.', 'NOT_STARTED', 1)
ON CONFLICT DO NOTHING;

INSERT INTO job_opportunities (id, employer_id, title, description, location, type, status, posted_at, closes_at) VALUES
  ('60000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', 'Cybersecurity Analyst Intern', 'Support security monitoring and risk assessment initiatives while learning from a multidisciplinary cybersecurity team. Synthetic demonstration listing.', 'Charlotte, NC', 'INTERNSHIP', 'ACTIVE', '2026-11-08 09:00:00-05', '2026-12-15 23:59:00-05'),
  ('60000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000002', 'Software Engineering Intern', 'Collaborate with mentors to build reliable product tools and ship tested features. Synthetic demonstration listing.', 'Charlotte, NC', 'INTERNSHIP', 'ACTIVE', '2026-11-10 09:00:00-05', '2026-12-20 23:59:00-05'),
  ('60000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000003', 'Data Analytics Co-op', 'Transform operational datasets into clear insights and dashboards for decision-makers. Synthetic demonstration listing.', 'Hybrid - Charlotte, NC', 'CO_OP', 'ACTIVE', '2026-11-05 09:00:00-05', '2026-12-10 23:59:00-05'),
  ('60000000-0000-4000-8000-000000000004', '50000000-0000-4000-8000-000000000004', 'Cloud Support Associate', 'Help maintain cloud systems and work with engineering teams to investigate technical issues. Synthetic demonstration listing.', 'Fort Mill, SC', 'ENTRY_LEVEL', 'ACTIVE', '2026-11-04 09:00:00-05', '2026-12-30 23:59:00-05'),
  ('60000000-0000-4000-8000-000000000005', '50000000-0000-4000-8000-000000000005', 'Past Data Intern Listing', 'A closed sample listing retained to demonstrate job lifecycle states.', 'Remote', 'INTERNSHIP', 'CLOSED', '2026-08-01 09:00:00-04', '2026-09-01 23:59:00-04')
ON CONFLICT DO NOTHING;

INSERT INTO job_skills (job_id, skill_id, is_required, importance) VALUES
  ('60000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', true, 1.00),
  ('60000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002', true, 1.00),
  ('60000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', true, 1.00),
  ('60000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000004', true, 1.00),
  ('60000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000005', true, 1.00),
  ('60000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000003', true, 1.00),
  ('60000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000007', true, 1.00),
  ('60000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000008', true, 1.00),
  ('60000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000009', true, 1.00),
  ('60000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000010', true, 1.00),
  ('60000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', true, 1.00),
  ('60000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000009', true, 1.00),
  ('60000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000011', true, 1.00),
  ('60000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000012', true, 1.00),
  ('60000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000013', true, 1.00),
  ('60000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000002', true, 1.00),
  ('60000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000007', true, 1.00),
  ('60000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000010', true, 1.00),
  ('60000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000014', false, 0.70),
  ('60000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000015', false, 0.50),
  ('60000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000012', true, 1.00)
ON CONFLICT DO NOTHING;

INSERT INTO saved_jobs (user_id, job_id) VALUES
  ('10000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000002'),
  ('10000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000004')
ON CONFLICT DO NOTHING;

COMMIT;
