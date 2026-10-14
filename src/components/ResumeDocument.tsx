import { withBrand } from "./Brand";
const experience = [
  {
    role: "Founder / Developer",
    company: "DREAMATRON",
    years: "2020 - Current",
    bullets: [
      "Building Project Tanuki, an independent Unreal Engine game with simulation-driven world systems.",
      "Implemented NPC AI, utility scoring, dynamic quests, dialogue, equipment, cooking, building, farming, and fishing systems.",
      "Own broad design and engineering tasks across gameplay, tools, UI, content workflows, and production planning.",
    ],
  },
  {
    role: "User Interface Design Scripter",
    company: "Ghost Story Games",
    years: "2018 - 2020",
    bullets: [
      "Worked on Judas, an unreleased first-person immersive sim built in Unreal Engine.",
      "Implemented user interface and gameplay systems using UMG, Unreal Engine 4, and C++.",
      "Collaborated across design and engineering to support fast iteration on player-facing systems.",
    ],
  },
  {
    role: "Associate Technical UI Designer",
    company: "Sony Santa Monica Studio",
    years: "2016 - 2018",
    bullets: [
      "Worked on God of War (2018), focusing on the primary game menu and related UI systems.",
      "Built menu logic, camera blending, UI animation systems, and state machines in Lua and C++.",
      "Supported development tools, narrative scripting, QA, and repeated usability passes from playtest feedback.",
    ],
  },
];

const selectedProjects = [
  {
    title: "Procedural Level Generator",
    meta: "Solo technical demo / Unreal Engine 5 / 2023",
    description:
      "Built a procedural level generation pipeline for configurable rooms, themes, serialized map data, and gameplay-aware quest support.",
  },
  {
    title: "Project EWA",
    meta: "Solo game project / Unreal Engine",
    description:
      "Developing a third-person adventure horror game with exploration, puzzle solving, combat, grid inventory, dialogue, and static camera systems.",
  },
  {
    title: "AI Model Timeline",
    meta: "React / TypeScript / Vite",
    description:
      "Created a public web app for comparing major AI model and coding-tool releases across companies on a single chronological timeline.",
  },
];

const skillGroups = [
  {
    title: "Skills",
    items: [
      "Gameplay Systems",
      "Optimization",
      "User Interface",
      "Technical Art",
      "C++",
      "Unreal Blueprints / UMG",
      "Python",
      "C#",
      "Lua",
    ],
  },
  {
    title: "Software",
    items: [
      "Visual Studio",
      "Unreal",
      "Blender",
      "Houdini",
      "Photoshop",
      "Ableton",
      "Unity",
      "Maya",
      "ZBrush",
      "Substance",
    ],
  },
];

const contactLinks = [
  { label: "www.kvick-games.com", href: "https://www.kvick-games.com/" },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/michael-nevins-690b3140/",
  },
  { label: "ArtStation", href: "https://www.artstation.com/kvick" },
  { label: "X / kvickart", href: "https://x.com/kvickart" },
];

const educationItems = [
  {
    title: "Game Programming (BS 2024)",
    details: [
      "Previously Illustration",
      "Academy of Art",
      "University San Francisco",
    ],
  },
  {
    title: "AI & Machine Learning Bootcamp (2023)",
    details: ["Caltech CTME"],
  },
];

const interests = ["AI / PCG / Math", "Art + Music Production", "Martial Arts"];

export default function ResumeDocument() {
  return (
    <section className="resume-document" aria-label="Michael Nevins resume">
      <div className="resume-document-actions">
        <button
          className="project-link-button"
          type="button"
          onClick={() => window.print()}
        >
          Export PDF
        </button>
        <a
          className="project-link-button project-link-button--secondary"
          href="/Resources/Michael_Nevins_Resume_GameplayProgrammer.pdf"
          target="_blank"
          rel="noreferrer"
        >
          Open Original
        </a>
      </div>

      <div className="resume-sheet">
        <header className="resume-document-header">
          <div className="resume-title-block">
            <h2>MICHAEL NEVINS</h2>
            <p>Software Developer / Technical Designer</p>
          </div>
          <ul className="resume-contact-list" aria-label="Resume links">
            {contactLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </header>

        <div className="resume-body">
          <div className="resume-main">
            <section className="resume-section resume-section--profile">
              <h3>Profile</h3>
              <p>
                Multi-disciplinary game developer with production experience
                across AAA, independent games, gameplay systems, interface
                systems, procedural generation, and tools. Comfortable working
                between design and engineering to turn unusual ideas into
                shippable systems.
              </p>
            </section>

            <section className="resume-section">
              <h3>Experience</h3>
              <div className="resume-timeline">
                {experience.map((item) => (
                  <article
                    key={`${item.company}-${item.role}`}
                    className="resume-entry"
                  >
                    <div>
                      <h4>{withBrand(item.company)}</h4>
                      <p>{item.role}</p>
                    </div>
                    <span>{item.years}</span>
                    <ul>
                      {item.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>

            <section className="resume-section">
              <h3>Selected Projects</h3>
              <div className="resume-project-list">
                {selectedProjects.map((project) => (
                  <article key={project.title}>
                    <h4>{project.title}</h4>
                    <p className="resume-entry-meta">{project.meta}</p>
                    <p>{project.description}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="resume-sidebar" aria-label="Resume sidebar">
            {skillGroups.map((group) => (
              <section key={group.title} className="resume-sidebar-section">
                <h3>{group.title}</h3>
                <p>{group.items.join(" / ")}</p>
              </section>
            ))}

            <section className="resume-sidebar-section">
              <h3>Education</h3>
              {educationItems.map((item) => (
                <article key={item.title}>
                  <h4>{item.title}</h4>
                  {item.details.map((detail) => (
                    <p key={detail}>{detail}</p>
                  ))}
                </article>
              ))}
            </section>

            <section className="resume-sidebar-section">
              <h3>Interests</h3>
              <ul>
                {interests.map((interest) => (
                  <li key={interest}>{interest}</li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}
