import { useEffect, useMemo, useState } from "react";
import {
  addProfileSkill as addProfileSkillRequest,
  createRoadmapActivity,
  deleteRoadmapActivity,
  loadAppData,
  removeProfileSkill as removeProfileSkillRequest,
  saveJob,
  unsaveJob,
  updateRoadmapActivity,
  type AppData,
  type Job,
  type RoadmapItem,
} from "./api";

type View = "home" | "jobs" | "saved" | "roadmap" | "profile";
type IconName =
  | "arrow"
  | "bookmark"
  | "briefcase"
  | "calendar"
  | "check"
  | "chevron"
  | "clock"
  | "close"
  | "compass"
  | "file"
  | "filter"
  | "home"
  | "map"
  | "menu"
  | "plus"
  | "search"
  | "spark"
  | "target"
  | "upload"
  | "user";

type MatchedJob = Job;

type NewRoadmapItem = Omit<RoadmapItem, "id" | "status">;
type SkillCoverageStatus = "In profile" | "Completed" | "Planned" | "Needs activity";

function getInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function getAcquiredSkills(profileSkills: string[], roadmap: RoadmapItem[]): Set<string> {
  const completedRoadmapSkills = roadmap
    .filter((item) => item.category === "Skill" && item.status === "Completed" && item.skill)
    .flatMap((item) => item.skill ? [item.skill.trim().toLowerCase()] : []);

  return new Set([
    ...profileSkills.map((skill) => skill.trim().toLowerCase()),
    ...completedRoadmapSkills,
  ]);
}

function getSkillCoverage(
  requiredSkills: string[],
  profileSkills: string[],
  roadmap: RoadmapItem[],
): { skill: string; status: SkillCoverageStatus }[] {
  const acquiredSkillSet = getAcquiredSkills(profileSkills, roadmap);
  const plannedSkillSet = new Set(
    roadmap
      .flatMap((item) => item.category === "Skill" && item.status !== "Completed" && item.skill
        ? [item.skill.trim().toLowerCase()]
        : []),
  );

  return requiredSkills.map((skill) => {
    const normalizedSkill = skill.toLowerCase();
    return {
      skill,
      status: profileSkills.some((profileSkill) => profileSkill.trim().toLowerCase() === normalizedSkill)
        ? "In profile"
        : acquiredSkillSet.has(normalizedSkill)
          ? "Completed"
        : plannedSkillSet.has(normalizedSkill)
          ? "Planned"
          : "Needs activity",
    };
  });
}

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
    bookmark: <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4Z" />,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" /><path d="M9 3v15M15 6v15" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    filter: <path d="M4 5h16M7 12h10M10 19h4" />,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    arrow: <path d="m15 18-6-6 6-6" />,
    upload: <><path d="M12 16V4m0 0L7 9m5-5 5 5" /><path d="M4 15v5h16v-5" /></>,
    file: <><path d="M6 2h8l4 4v16H6Z" /><path d="M14 2v5h5M9 13h6M9 17h6" /></>,
    spark: <><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z" /><path d="m5 15 .8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8Z" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15 9-2 4-4 2 2-4Z" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function Logo() {
  return (
    <div className="brand" aria-label="CareerPath">
      <span className="brand-mark"><span /></span>
      <span>Career<span>Path</span></span>
    </div>
  );
}

function ProgressRing({ value, size = "large" }: { value: number; size?: "small" | "large" }) {
  return (
    <div className={`progress-ring ${size}`} style={{ "--progress": `${value * 3.6}deg` } as React.CSSProperties}>
      <div><strong>{value}%</strong>{size === "large" && <span>complete</span>}</div>
    </div>
  );
}

function AppButton({
  children,
  variant = "primary",
  icon,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  icon?: IconName;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button className={`btn ${variant}`} onClick={onClick} disabled={disabled} type={type}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}

function Sidebar({
  view,
  setView,
  open,
  close,
  displayName,
  savedCount,
}: {
  view: View;
  setView: (view: View) => void;
  open: boolean;
  close: () => void;
  displayName: string;
  savedCount: number;
}) {
  const navigation: { id: View; label: string; icon: IconName }[] = [
    { id: "home", label: "Overview", icon: "home" },
    { id: "jobs", label: "Explore jobs", icon: "briefcase" },
    { id: "saved", label: "Saved jobs", icon: "bookmark" },
    { id: "roadmap", label: "My roadmap", icon: "map" },
    { id: "profile", label: "My profile", icon: "user" },
  ];
  return (
    <>
      {open && <button className="mobile-scrim" onClick={close} aria-label="Close navigation" />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-top">
          <Logo />
          <button className="icon-button sidebar-close" onClick={close} aria-label="Close navigation"><Icon name="close" /></button>
        </div>
        <nav aria-label="Main navigation">
          <p className="eyebrow">Workspace</p>
          {navigation.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${view === item.id ? "active" : ""}`}
              onClick={() => { setView(item.id); close(); }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.id === "saved" && <span className="nav-count">{savedCount}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-callout">
          <span className="callout-icon"><Icon name="spark" /></span>
          <strong>Career Center</strong>
          <p>Book a 1:1 appointment with a CCI career advisor.</p>
          <button>View resources <Icon name="chevron" size={15} /></button>
        </div>
        <button className="account-card" onClick={() => setView("profile")}>
          <span className="avatar">{getInitials(displayName)}</span>
          <span><strong>{displayName}</strong><small>CareerPath student</small></span>
          <Icon name="chevron" size={16} />
        </button>
      </aside>
    </>
  );
}

function Header({ title, openMenu, displayName }: { title: string; openMenu: () => void; displayName: string }) {
  return (
    <header className="topbar">
      <button className="icon-button menu-button" onClick={openMenu} aria-label="Open navigation"><Icon name="menu" /></button>
      <div>
        <p className="topbar-kicker">UNC Charlotte · CCI</p>
        <h1>{title}</h1>
      </div>
      <div className="top-actions">
        <button className="icon-button notification" aria-label="Notifications"><span /></button>
        <span className="avatar small">{getInitials(displayName)}</span>
      </div>
    </header>
  );
}

function Dashboard({
  setView,
  jobs,
  savedCount,
  careerTitle,
}: {
  setView: (view: View) => void;
  jobs: MatchedJob[];
  savedCount: number;
  careerTitle: string;
}) {
  return (
    <div className="page dashboard-page">
      <section className="welcome-card">
        <div>
          <span className="status-pill light"><Icon name="spark" size={15} /> Your weekly focus</span>
          <h2>Build the skills that get you hired.</h2>
          <p>You’re closer than you think. Complete two roadmap activities this week to improve your match for {careerTitle.toLowerCase()} roles.</p>
          <div className="welcome-actions">
            <AppButton onClick={() => setView("roadmap")}>Continue roadmap <Icon name="chevron" size={17} /></AppButton>
            <AppButton variant="ghost" onClick={() => setView("jobs")}>Explore roles</AppButton>
          </div>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <span className="orbit orbit-one" />
          <span className="orbit orbit-two" />
          <span className="art-node node-one"><Icon name="check" /></span>
          <span className="art-node node-two"><Icon name="briefcase" /></span>
          <span className="art-node node-three"><Icon name="target" /></span>
          <span className="art-center"><span>84%</span><small>career ready</small></span>
        </div>
      </section>

      <section className="stat-grid">
        <article className="stat-card">
          <span className="stat-icon green"><Icon name="map" /></span>
          <div><p>Roadmap progress</p><strong>4 of 8</strong><small>milestones complete</small></div>
          <span className="trend">+12%</span>
        </article>
        <article className="stat-card">
          <span className="stat-icon blue"><Icon name="target" /></span>
          <div><p>Profile strength</p><strong>84%</strong><small>3 suggestions remaining</small></div>
        </article>
        <article className="stat-card">
          <span className="stat-icon amber"><Icon name="bookmark" /></span>
          <div><p>Saved opportunities</p><strong>{savedCount} jobs</strong><small>Saved to your shortlist</small></div>
        </article>
      </section>

      <div className="content-grid">
        <section className="panel next-step">
          <div className="section-heading">
            <div><span className="eyebrow green-text">Up next</span><h3>Your next milestone</h3></div>
            <button className="text-button" onClick={() => setView("roadmap")}>View roadmap <Icon name="chevron" size={15} /></button>
          </div>
          <div className="milestone-feature">
            <div className="milestone-line"><span className="complete"><Icon name="check" size={16} /></span><i /><span className="current">2</span><i /><span>3</span></div>
            <div className="milestone-info">
              <span className="tag">Portfolio · 4 weeks</span>
              <h4>Build a full-stack portfolio project</h4>
              <p>Demonstrate your React and API skills with a project employers can explore.</p>
              <div className="milestone-footer">
                <div className="mini-avatars"><span>AM</span><span>RK</span><small>2 mentors available</small></div>
                <AppButton onClick={() => setView("roadmap")}>Resume activity</AppButton>
              </div>
            </div>
          </div>
        </section>

        <section className="panel readiness">
          <div className="section-heading"><div><span className="eyebrow">Career readiness</span><h3>{careerTitle}</h3></div><button className="icon-button"><Icon name="chevron" /></button></div>
          <div className="readiness-main">
            <ProgressRing value={84} />
            <div className="skill-bars">
              <div><span><b>Technical skills</b><em>88%</em></span><i><b style={{ width: "88%" }} /></i></div>
              <div><span><b>Experience</b><em>72%</em></span><i><b style={{ width: "72%" }} /></i></div>
              <div><span><b>Career prep</b><em>91%</em></span><i><b style={{ width: "91%" }} /></i></div>
            </div>
          </div>
          <button className="insight-row" onClick={() => setView("jobs")}><span><Icon name="spark" /></span><div><strong>Top opportunity</strong><small>{jobs.length} active roles to explore</small></div><Icon name="chevron" /></button>
        </section>
      </div>

      <section className="panel recommended">
        <div className="section-heading">
          <div><span className="eyebrow">Based on your profile</span><h3>Recommended opportunities</h3></div>
          <button className="text-button" onClick={() => setView("jobs")}>See all jobs <Icon name="chevron" size={15} /></button>
        </div>
        <div className="job-preview-grid">
          {jobs.slice(0, 3).map((job) => (
            <button className="job-preview" key={job.id} onClick={() => setView("jobs")}>
              <span className={`company-logo ${job.logoClass}`}>{job.logo}</span>
              <span className="job-preview-copy"><strong>{job.title}</strong><small>{job.company} · {job.location}</small><span><b>{job.match}% match</b> · {job.type}</span></span>
              <Icon name="chevron" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function JobsView({
  jobs,
  saved,
  onToggleSave,
  onAddSkill,
}: {
  jobs: MatchedJob[];
  saved: string[];
  onToggleSave: (id: string) => void;
  onAddSkill: (skill: string) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MatchedJob | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeType, setActiveType] = useState("All roles");
  const filtered = useMemo(() => jobs.filter((job) =>
    `${job.title} ${job.company} ${job.requiredSkills.join(" ")}`.toLowerCase().includes(query.toLowerCase()) &&
    (activeType === "All roles" || job.type === activeType)
  ), [jobs, query, activeType]);

  if (selected) {
    return (
      <div className="page job-detail-page">
        <button className="back-button" onClick={() => setSelected(null)}><Icon name="arrow" /> Back to opportunities</button>
        <section className="job-detail-hero">
          <div className={`company-logo large ${selected.logoClass}`}>{selected.logo}</div>
          <div className="job-title-block">
            <span className="status-pill">{selected.match}% profile match</span>
            <h2>{selected.title}</h2>
            <p>{selected.company} <span /> {selected.location} <span /> {selected.type}</p>
          </div>
          <div className="detail-actions">
            <AppButton variant="secondary" icon="bookmark" onClick={() => onToggleSave(selected.id)}>
              {saved.includes(selected.id) ? "Saved" : "Save job"}
            </AppButton>
            <AppButton>Apply on company site <Icon name="chevron" size={17} /></AppButton>
          </div>
        </section>
        <div className="detail-grid">
          <div>
            <section className="panel match-panel">
              <div className="section-heading">
                <div><span className="eyebrow green-text">Your skill match</span><h3>{selected.match >= 70 ? "You’re a strong candidate" : "Build your match for this role"}</h3></div>
                <ProgressRing value={selected.match} size="small" />
              </div>
              <p className="section-intro">Your profile matches {selected.skills.length} of {selected.requiredSkills.length} core skills. Add missing skills to your roadmap to become more competitive.</p>
              <div className="skills-columns">
                <div><h4><span className="dot green" /> Skills you have</h4>{selected.skills.map((skill) => <span className="skill-row" key={skill}><Icon name="check" size={16} /> {skill}<small>From profile</small></span>)}</div>
                <div><h4><span className="dot amber" /> Skills to develop</h4>{selected.missing.map((skill) => <span className="skill-row missing" key={skill}><Icon name="target" size={16} /> {skill}<button onClick={() => void onAddSkill(skill)}><Icon name="plus" size={15} /> Add</button></span>)}</div>
              </div>
            </section>
            <section className="panel about-role">
              <h3>About the role</h3>
              <p>{selected.description}</p>
              <h4>What you’ll bring</h4>
              <ul><li>Currently pursuing a bachelor’s degree in Computer Science or a related field</li><li>Strong problem-solving and communication skills</li><li>Interest in learning through hands-on collaboration</li></ul>
            </section>
          </div>
          <aside className="panel detail-sidebar">
            <h3>Opportunity details</h3>
            <div><Icon name="briefcase" /><span><small>Employment type</small><strong>{selected.type}</strong></span></div>
            <div><Icon name="compass" /><span><small>Location</small><strong>{selected.location}</strong></span></div>
            <div><Icon name="calendar" /><span><small>Posted</small><strong>{selected.posted}</strong></span></div>
            <hr />
            <span className="partner-badge"><Icon name="check" size={15} /> UNCC partner employer</span>
            <p>This employer actively recruits students from UNC Charlotte.</p>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="page jobs-page">
      <section className="jobs-hero">
        <span className="eyebrow green-text">Curated for CCI students</span>
        <h2>Find work that fits your path.</h2>
        <p>Explore roles from university partners, matched to your skills and career goals.</p>
        <div className="search-bar">
          <Icon name="search" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by role, company, or skill" aria-label="Search jobs" />
          <button className="filter-button" onClick={() => setFilterOpen(!filterOpen)}><Icon name="filter" size={18} /> Filters</button>
        </div>
        {filterOpen && (
          <div className="filter-panel">
            <span>Role type</span>
            {["All roles", "Internship", "Co-op", "Entry level"].map((type) => <button className={activeType === type ? "active" : ""} onClick={() => setActiveType(type)} key={type}>{type}</button>)}
          </div>
        )}
      </section>
      <div className="results-heading"><div><h3>{filtered.length} recommended opportunities</h3><p>Ranked by your profile, coursework, and interests</p></div><select aria-label="Sort jobs"><option>Best match</option><option>Most recent</option></select></div>
      <div className="jobs-list">
        {filtered.map((job) => (
          <article className="job-card" key={job.id}>
            <div className={`company-logo ${job.logoClass}`}>{job.logo}</div>
            <div className="job-card-main">
              <div className="job-card-title"><div><span className="status-pill">{job.match}% match</span><h3>{job.title}</h3><p>{job.company} · {job.location}</p></div><button className={`save-button ${saved.includes(job.id) ? "saved" : ""}`} onClick={() => onToggleSave(job.id)} aria-label="Save job"><Icon name="bookmark" /></button></div>
              <div className="job-tags"><span>{job.type}</span>{job.skills.slice(0, 2).map((skill) => <span key={skill}>{skill}</span>)}</div>
              <div className="job-card-footer"><small>Posted {job.posted}</small><button onClick={() => setSelected(job)}>View opportunity <Icon name="chevron" size={16} /></button></div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && <div className="empty-state"><span><Icon name="search" /></span><h3>No roles found</h3><p>Try a broader title or clear your filters.</p></div>}
      </div>
    </div>
  );
}

function RoadmapView({
  roadmap,
  profileSkills,
  careerSkills,
  careerTitle,
  addActivity,
  onAddSkill,
  removeActivity,
  updateStatus,
  courseFile,
  importCourses,
}: {
  roadmap: RoadmapItem[];
  profileSkills: string[];
  careerSkills: string[];
  careerTitle: string;
  addActivity: (activity: NewRoadmapItem) => Promise<void>;
  onAddSkill: (skill: string) => Promise<void>;
  removeActivity: (id: string) => Promise<void>;
  updateStatus: (id: string, status: RoadmapItem["status"]) => Promise<void>;
  courseFile: string;
  importCourses: (fileName: string) => void;
}) {
  const [selected, setSelected] = useState<RoadmapItem | null>(null);
  const [addingActivity, setAddingActivity] = useState(false);
  const [activityCategory, setActivityCategory] = useState("Skill");
  const complete = roadmap.filter((item) => item.status === "Completed").length;
  const percent = roadmap.length ? Math.round((complete / roadmap.length) * 100) : 0;
  const skillCoverage = getSkillCoverage(careerSkills, profileSkills, roadmap);
  const handleAddActivity = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    await addActivity({
      title: String(formData.get("title")).trim(),
      category: String(formData.get("category")),
      duration: String(formData.get("duration")).trim() || "Flexible",
      description: String(formData.get("description")).trim() || "Added to your career roadmap.",
      ...(formData.get("skill") ? { skill: String(formData.get("skill")) } : {}),
    });
    form.reset();
    setAddingActivity(false);
    setActivityCategory("Skill");
  };
  return (
    <div className="page roadmap-page">
      <section className="roadmap-header">
        <div><span className="eyebrow green-text">Personalized for your goal</span><h2>{careerTitle} roadmap</h2><p>A flexible plan based on your profile, coursework, and roles you want.</p></div>
        <div className="roadmap-score"><ProgressRing value={percent} size="small" /><span><strong>{complete} of {roadmap.length}</strong><small>activities complete</small></span></div>
      </section>
      <div className="roadmap-layout">
        <section className="roadmap-timeline">
          <div className="timeline-heading">
            <div><span className="tag">Phase 2</span><h3>Build practical experience</h3><p>Turn your core knowledge into demonstrable work.</p></div>
            <div className="timeline-actions">
              <span className="phase-progress">{complete}/{roadmap.length} complete</span>
              <AppButton icon="plus" onClick={() => setAddingActivity((current) => !current)}>{addingActivity ? "Cancel" : "Add activity"}</AppButton>
            </div>
          </div>
          {addingActivity && (
            <form className="roadmap-add-form" onSubmit={handleAddActivity}>
              <label>
                Activity name
                <input name="title" required maxLength={100} placeholder="e.g. Complete a networking fundamentals course" />
              </label>
              <div className="roadmap-form-row">
                <label>
                  Category
                  <select name="category" value={activityCategory} onChange={(event) => setActivityCategory(event.target.value)}>
                    <option>Skill</option>
                    <option>Course</option>
                    <option>Project</option>
                    <option>Career prep</option>
                    <option>Networking</option>
                  </select>
                </label>
                <label>
                  Duration
                  <input name="duration" maxLength={40} placeholder="e.g. 3 weeks" />
                </label>
              </div>
              {activityCategory === "Skill" && (
                <label>
                  Related career skill
                  <select name="skill" defaultValue="">
                    <option value="">Select a skill (optional)</option>
                    {careerSkills.map((skill) => <option value={skill} key={skill}>{skill}</option>)}
                  </select>
                </label>
              )}
              <label>
                Description
                <textarea name="description" rows={2} maxLength={240} placeholder="What will you work on?" />
              </label>
              <AppButton type="submit">Add to roadmap</AppButton>
            </form>
          )}
          {roadmap.filter((item) => item.status !== "Not started").map((item) => {
            const index = roadmap.indexOf(item);
            return (
            <article className={`timeline-item ${item.status.toLowerCase().replace(" ", "-")}`} key={item.id}>
              <div className="timeline-rail"><span>{item.status === "Completed" ? <Icon name="check" size={17} /> : index + 1}</span>{index < roadmap.length - 1 && <i />}</div>
              <button className="timeline-card" onClick={() => setSelected(item)}>
                <div><span className="tag">{item.category}</span><h4>{item.title}</h4><p>{item.description}</p><small><Icon name="clock" size={14} /> {item.duration}</small></div>
                <span className={`item-status ${item.status.toLowerCase().replace(" ", "-")}`}>{item.status}</span>
                <Icon name="chevron" />
              </button>
            </article>
            );
          })}
          {roadmap.some((item) => item.status === "Not started") && (
            <details className="timeline-more">
              <summary>
                <span className="when-closed">Show {roadmap.filter((item) => item.status === "Not started").length} upcoming activities</span>
                <span className="when-open">Hide upcoming activities</span>
                <Icon name="chevron" size={18} />
              </summary>
              {roadmap.filter((item) => item.status === "Not started").map((item) => {
                const index = roadmap.indexOf(item);
                return (
                  <article className="timeline-item not-started" key={item.id}>
                    <div className="timeline-rail"><span>{index + 1}</span>{index < roadmap.length - 1 && <i />}</div>
                    <button className="timeline-card" onClick={() => setSelected(item)}>
                      <div><span className="tag">{item.category}</span><h4>{item.title}</h4><p>{item.description}</p><small><Icon name="clock" size={14} /> {item.duration}</small></div>
                      <span className="item-status not-started">{item.status}</span>
                      <Icon name="chevron" />
                    </button>
                  </article>
                );
              })}
            </details>
          )}
        </section>
        <aside>
          <section className="panel skill-coverage">
            <span className="eyebrow green-text">{careerTitle}</span>
            <h3>Skill coverage</h3>
            <p>Profile skills and completed skill activities count as learned. Incomplete activities stay planned.</p>
            <div className="coverage-list">
              {skillCoverage.map(({ skill, status }) => (
                <div className="coverage-row" key={skill}>
                  <span>{skill}</span>
                  {status === "Needs activity" ? (
                    <button className="coverage-add" onClick={() => void onAddSkill(skill)}><Icon name="plus" size={14} /> Add</button>
                  ) : (
                    <small className={`coverage-status ${status === "In profile" || status === "Completed" ? "acquired" : "planned"}`}>{status}</small>
                  )}
                </div>
              ))}
            </div>
          </section>
          <section className="panel roadmap-courses">
            <span className="stat-icon green"><Icon name="file" /></span>
            <div>
              <span className="eyebrow">Academic history</span>
              <h3>Import completed courses</h3>
              <p>Upload a transcript or course history so completed and transfer credits can shape your roadmap.</p>
            </div>
            <label className={`upload-zone course-upload ${courseFile ? "uploaded" : ""}`}>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.csv"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) importCourses(file.name);
                }}
              />
              <span><Icon name={courseFile ? "check" : "upload"} /></span>
              <div>
                <strong>{courseFile || "Upload course history"}</strong>
                <small>{courseFile ? "Selected locally · Not saved" : "PDF, DOCX or CSV · Helpful for transfer students"}</small>
              </div>
              <b>{courseFile ? "Replace" : "Choose file"}</b>
            </label>
          </section>
          <section className="panel roadmap-aside">
            <span className="stat-icon green"><Icon name="spark" /></span>
            <h3>Why this roadmap?</h3>
            <p>Built from your Software Engineering goal and gaps found in saved job listings.</p>
            <div><span>Current goal</span><strong>Software Engineer</strong></div>
            <div><span>Target graduation</span><strong>May 2027</strong></div>
            <AppButton variant="secondary">Edit career goal</AppButton>
          </section>
          <section className="panel advisor-card">
            <div className="advisor-avatars"><span>AW</span><span className="online" /></div>
            <div><span className="eyebrow">Need guidance?</span><h3>Talk to an advisor</h3><p>Review your plan with a CCI career coach.</p></div>
            <button>Book a session <Icon name="chevron" size={16} /></button>
          </section>
        </aside>
      </div>
      {selected && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label={selected.title}>
          <button className="modal-scrim" onClick={() => setSelected(null)} aria-label="Close activity" />
          <section className="activity-modal">
            <button className="icon-button modal-close" onClick={() => setSelected(null)}><Icon name="close" /></button>
            <span className="stat-icon green"><Icon name={selected.category === "Course" ? "file" : "target"} /></span>
            <span className="eyebrow green-text">{selected.category} · {selected.duration}</span>
            <h2>{selected.title}</h2>
            <p>{selected.description}</p>
            <div className="resource-box"><Icon name="file" /><span><strong>Activity guide</strong><small>Steps, resources, and completion criteria</small></span><Icon name="chevron" /></div>
            <div className="modal-footer">
              <span>Current status: <strong>{selected.status}</strong></span>
              <div className="activity-actions">
                <AppButton variant="secondary" onClick={() => { void removeActivity(selected.id).then(() => setSelected(null)); }}>Remove activity</AppButton>
                <AppButton onClick={() => {
                  const status = selected.status === "Not started" ? "In progress" : "Completed";
                  void updateStatus(selected.id, status).then(() => setSelected(null));
                }}>
                  {selected.status === "Not started" ? "Mark in progress" : selected.status === "In progress" ? "Mark complete" : "Completed"}
                </AppButton>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function SavedView({ jobs, saved, onToggleSave, openJobs }: { jobs: MatchedJob[]; saved: string[]; onToggleSave: (id: string) => void; openJobs: () => void }) {
  const savedJobs = jobs.filter((job) => saved.includes(job.id));
  return (
    <div className="page saved-page">
      <section className="page-title"><span className="eyebrow green-text">Your shortlist</span><h2>Saved opportunities</h2><p>Keep track of roles you’re interested in and prepare before you apply.</p></section>
      {savedJobs.length ? (
        <div className="saved-grid">
          {savedJobs.map((job) => (
            <article className="saved-card" key={job.id}>
              <div className="saved-card-top"><span className={`company-logo ${job.logoClass}`}>{job.logo}</span><button className="save-button saved" onClick={() => onToggleSave(job.id)}><Icon name="bookmark" /></button></div>
              <span className="status-pill">{job.match}% match</span><h3>{job.title}</h3><p>{job.company} · {job.location}</p>
              <div className="missing-skills"><small>Skills to strengthen</small><div>{job.missing.map((skill) => <span key={skill}>{skill}</span>)}</div></div>
              <div className="saved-deadline"><Icon name="clock" size={17} /><span><small>Application status</small><strong>Ready to apply</strong></span></div>
              <AppButton onClick={openJobs}>Review opportunity</AppButton>
            </article>
          ))}
        </div>
      ) : <div className="empty-state panel"><span><Icon name="bookmark" /></span><h3>No saved jobs yet</h3><p>Save opportunities while exploring so you can return to them here.</p><AppButton onClick={openJobs}>Explore jobs</AppButton></div>}
    </div>
  );
}

function ProfileView({
  skills,
  displayName,
  careerTitle,
  onAddSkill,
  onRemoveSkill,
}: {
  skills: string[];
  displayName: string;
  careerTitle: string;
  onAddSkill: (skill: string) => Promise<void>;
  onRemoveSkill: (skill: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const addSkill = async () => {
    await onAddSkill(newSkill);
    setNewSkill("");
    setAdding(false);
  };
  return (
    <div className="page profile-page">
      <section className="page-title"><span className="eyebrow green-text">Your career identity</span><h2>Profile & experience</h2><p>Keep this current to get more accurate role matches and roadmap recommendations.</p></section>
      <div className="profile-layout">
        <aside className="panel profile-summary">
          <div className="profile-avatar">{getInitials(displayName)}<span><Icon name="check" size={14} /></span></div>
          <h3>{displayName}</h3><p>CareerPath student</p><span className="partner-badge">UNC Charlotte</span>
          <hr />
          <div className="profile-completion"><span><strong>84%</strong><small>Profile strength</small></span><i><b /></i></div>
          <p className="profile-hint"><Icon name="spark" size={17} /> Add a resume to improve your job matches.</p>
        </aside>
        <div className="profile-content">
          <section className="panel profile-section">
            <div className="section-heading"><div><span className="eyebrow">About you</span><h3>Academic details</h3></div><button className="text-button">Edit</button></div>
            <div className="details-grid"><div><small>University</small><strong>UNC Charlotte</strong></div><div><small>College</small><strong>College of Computing & Informatics</strong></div><div><small>Career goal</small><strong>{careerTitle}</strong></div><div><small>Expected graduation</small><strong>May 2027</strong></div></div>
          </section>
          <section className="panel profile-section">
            <div className="section-heading"><div><span className="eyebrow">What you know</span><h3>Skills</h3></div><button className="text-button" onClick={() => setAdding(true)}><Icon name="plus" size={16} /> Add skill</button></div>
            <div className="profile-skills">{skills.map((skill) => <span key={skill}>{skill}<button aria-label={`Remove ${skill}`} onClick={() => onRemoveSkill(skill)}><Icon name="close" size={13} /></button></span>)}</div>
            {adding && <div className="inline-form"><input autoFocus value={newSkill} onChange={(event) => setNewSkill(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addSkill()} placeholder="Enter a skill" /><AppButton onClick={addSkill}>Add</AppButton><AppButton variant="ghost" onClick={() => setAdding(false)}>Cancel</AppButton></div>}
          </section>
          <section className="panel profile-section">
            <div className="section-heading"><div><span className="eyebrow">Documents</span><h3>Resume & coursework</h3></div></div>
            <button className="upload-zone" disabled>
              <span><Icon name="upload" /></span>
              <div><strong>Upload your resume or transcript</strong><small>File upload and analysis are not connected yet.</small></div>
              <b>Coming soon</b>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] = useState<AppData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [courseFile, setCourseFile] = useState("");
  const [toast, setToast] = useState("");
  const [toastIsError, setToastIsError] = useState(false);

  useEffect(() => {
    let active = true;
    loadAppData().then((result) => {
      if (active) {
        setData(result);
        setLoadError("");
      }
    }).catch((error: unknown) => {
      if (active) setLoadError(error instanceof Error ? error.message : "Could not load CareerPath data.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const showToast = (message: string, isError = false) => {
    setToast(message);
    setToastIsError(isError);
    window.setTimeout(() => setToast(""), 2600);
  };
  const runMutation = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action();
      const updated = await loadAppData();
      setData(updated);
      showToast(successMessage);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "The request could not be completed.", true);
    }
  };
  const toggleSave = (id: string) => {
    if (!data) return Promise.resolve();
    const isSaved = data.savedJobIds.includes(id);
    return runMutation(
      () => isSaved ? unsaveJob(id) : saveJob(id),
      isSaved ? "Removed from saved jobs" : "Job saved to your shortlist",
    );
  };
  const addProfileSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (!trimmedSkill || !data) return Promise.resolve();
    if (data.profileSkills.some((item) => item.toLowerCase() === trimmedSkill.toLowerCase())) {
      showToast("That skill is already in your profile", true);
      return Promise.resolve();
    }
    return runMutation(() => addProfileSkillRequest(trimmedSkill), `${trimmedSkill} added to your profile`);
  };
  const removeProfileSkill = (skill: string) => {
    return runMutation(() => removeProfileSkillRequest(skill), `${skill} removed from your profile`);
  };
  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (!trimmedSkill || !data) return Promise.resolve();
    const title = `Develop ${trimmedSkill}`;
    if (data.roadmap.some((item) =>
      item.category === "Skill" &&
      (item.skill?.trim().toLowerCase() === trimmedSkill.toLowerCase() ||
        item.title.trim().toLowerCase() === title.toLowerCase()),
    )) {
      showToast(`${trimmedSkill} is already on your roadmap`);
      return Promise.resolve();
    }
    return runMutation(() => createRoadmapActivity({
      title,
      category: "Skill",
      duration: "3 weeks",
      description: `Build practical ${trimmedSkill} experience through a guided project selected for your career goal.`,
      skill: trimmedSkill,
    }), `${trimmedSkill} added to your roadmap`);
  };
  const addRoadmapActivity = (activity: NewRoadmapItem) => {
    return runMutation(() => createRoadmapActivity(activity), "Activity added to your roadmap");
  };
  const removeRoadmapActivity = (id: string) => {
    return runMutation(() => deleteRoadmapActivity(id), "Activity removed from your roadmap");
  };
  const updateStatus = (id: string, status: RoadmapItem["status"]) => {
    return runMutation(() => updateRoadmapActivity(id, status), "Roadmap progress updated");
  };
  const importCourses = (fileName: string) => {
    setCourseFile(fileName);
    showToast("Transcript upload is a demo placeholder and is not saved.");
  };

  const titles: Record<View, string> = { home: "Overview", jobs: "Explore jobs", saved: "Saved jobs", roadmap: "My roadmap", profile: "My profile" };
  if (loading) {
    return <main className="app-shell"><section className="page"><p>Connecting to CareerPath…</p></section></main>;
  }
  if (!data) {
    return (
      <main className="app-shell">
        <section className="page panel">
          <h1>CareerPath API unavailable</h1>
          <p>{loadError || "The API did not return application data."}</p>
          <p>Start the Node API with <code>npm run dev:api</code>, then reload this page.</p>
          <AppButton onClick={() => window.location.reload()}>Retry</AppButton>
        </section>
      </main>
    );
  }
  const { profileSkills, roadmap, savedJobIds: saved } = data;
  const matchedJobs = data.jobs;
  const displayName = data.user.displayName;
  const careerTitle = data.user.career || "Career exploration";
  return (
    <div className="app-shell">
      <Sidebar view={view} setView={setView} open={menuOpen} close={() => setMenuOpen(false)} displayName={displayName} savedCount={saved.length} />
      <main className="main-shell">
        <Header title={titles[view]} openMenu={() => setMenuOpen(true)} displayName={displayName} />
        {view === "home" && <Dashboard setView={setView} jobs={matchedJobs} savedCount={saved.length} careerTitle={careerTitle} />}
        {view === "jobs" && <JobsView jobs={matchedJobs} saved={saved} onToggleSave={toggleSave} onAddSkill={addSkill} />}
        {view === "saved" && <SavedView jobs={matchedJobs} saved={saved} onToggleSave={toggleSave} openJobs={() => setView("jobs")} />}
        {view === "roadmap" && <RoadmapView roadmap={roadmap} profileSkills={profileSkills} careerSkills={data.careerSkills} careerTitle={careerTitle} addActivity={addRoadmapActivity} onAddSkill={addSkill} removeActivity={removeRoadmapActivity} updateStatus={updateStatus} courseFile={courseFile} importCourses={importCourses} />}
        {view === "profile" && <ProfileView skills={profileSkills} displayName={displayName} careerTitle={careerTitle} onAddSkill={addProfileSkill} onRemoveSkill={removeProfileSkill} />}
      </main>
      {toast && <div className={`toast ${toastIsError ? "error" : ""}`}><span><Icon name={toastIsError ? "close" : "check"} size={16} /></span>{toast}</div>}
    </div>
  );
}
