import { withBrand } from "./Brand";
import "../resume.css";

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

/**
 * The résumé as a document: a white main column and a charcoal sidebar topped
 * by a navy block, after the layout of the original PDF résumés in /Resources.
 * The sheet stays paper-coloured in both site themes, like a printed page.
 * "Export PDF" prints the page; resume.css's print rules reduce it to this sheet.
 */
export default function ResumeDocument() {
  return (
    <article className="resume" aria-labelledby="resume-name">
      <header className="resume-head">
        <h2 id="resume-name" className="resume-name">
          Michael <span>Nevins</span>
        </h2>
        <p className="resume-role">Software Developer / Technical Designer</p>
        <p className="resume-summary">
          Multi-disciplinary game developer with production experience across
          AAA, independent games, gameplay systems, interface systems,
          procedural generation, and tools. Comfortable working between design
          and engineering to turn unusual ideas into shippable systems.
        </p>
      </header>

      <div className="resume-band">
        <div className="resume-actions">
          <button
            className="resume-action"
            type="button"
            onClick={() => window.print()}
          >
            Export PDF
          </button>
          <a
            className="resume-action resume-action--quiet"
            href="/Resources/Michael_Nevins_Resume_GameplayProgrammer.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Open original
          </a>
        </div>
      </div>

      <div className="resume-main">
        <section className="resume-section" aria-labelledby="resume-experience">
          <h3 id="resume-experience">Experience</h3>
          <div className="resume-entries">
            {experience.map((item) => (
              <div key={`${item.company}-${item.role}`} className="resume-entry">
                <div className="resume-entry-head">
                  <h4>{withBrand(item.company)}</h4>
                  <span className="resume-dates">{item.years}</span>
                </div>
                <p className="resume-entry-role">{item.role}</p>
                <ul className="resume-lines">
                  {item.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="resume-section" aria-labelledby="resume-projects">
          <h3 id="resume-projects">Selected Projects</h3>
          <div className="resume-entries">
            {selectedProjects.map((project) => (
              <div key={project.title} className="resume-entry">
                <h4>{project.title}</h4>
                <p className="resume-entry-role">{project.meta}</p>
                <p className="resume-lines">{project.description}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="resume-skillset">
          {skillGroups.map((group) => (
            <section
              key={group.title}
              className={`resume-section resume-section--${group.title.toLowerCase()}`}
              aria-label={group.title}
            >
              <h3>{group.title}</h3>
              <ul className="resume-list">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <aside className="resume-side" aria-label="Contact, education and interests">
        <section className="resume-side-section">
          <h3>Contact</h3>
          <ul>
            {contactLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="resume-side-section">
          <h3>Education</h3>
          {educationItems.map((item) => (
            <div key={item.title} className="resume-school">
              <h4>{item.title}</h4>
              {item.details.map((detail) => (
                <p key={detail}>{detail}</p>
              ))}
            </div>
          ))}
        </section>

        <section className="resume-side-section">
          <h3>Interests</h3>
          <ul>
            {interests.map((interest) => (
              <li key={interest}>{interest}</li>
            ))}
          </ul>
        </section>
      </aside>
    </article>
  );
}
