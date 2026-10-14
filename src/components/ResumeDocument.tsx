import Brand, { withBrand } from "./Brand";
import "../resume.css";
import {
  contactLinks,
  educationItems,
  experience,
  interests,
  resumePdf,
  selectedProjects,
  skillGroups,
} from "../data/resume";

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
          AAA, independent games, gameplay and interface systems, procedural
          generation, and tools. Now focused on AI experimentation and on
          building the engine and tools for the next generation of games at{" "}
          <Brand />.
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
            href={resumePdf}
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
                    <li key={bullet}>{withBrand(bullet)}</li>
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
                <p className="resume-entry-role">{withBrand(project.meta)}</p>
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
