import { withBrand } from "./Brand";
import { educationItems, experience, resumePdf, skillGroups } from "../data/resume";

/**
 * The technical designer résumé set in the page's own type, for the home
 * page's close. The PDF is the same résumé, offered as a download.
 */
export default function ResumeSummary() {
  return (
    <section className="resume-summary-block" aria-labelledby="resume-summary-title">
      <header className="resume-summary-head" data-reveal>
        <h3 id="resume-summary-title">Résumé</h3>
        <p>Technical designer</p>
        <a className="text-link" href={resumePdf} target="_blank" rel="noreferrer" download>
          Download PDF
        </a>
      </header>
      <ol className="resume-summary-jobs">
        {experience.map((job) => (
          <li key={job.company} data-reveal>
            <div className="resume-summary-job-head">
              <h4>{withBrand(job.company)}</h4>
              <span>{job.years.replace(" - ", "–")}</span>
            </div>
            <p className="resume-summary-role">{job.role}</p>
            <ul>
              {job.bullets.map((bullet) => (
                <li key={bullet}>{withBrand(bullet)}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <dl className="resume-summary-facts" data-reveal>
        {skillGroups.map((group) => (
          <div key={group.title}>
            <dt>{group.title}</dt>
            <dd>{group.items.join(", ")}</dd>
          </div>
        ))}
        <div>
          <dt>Education</dt>
          <dd>
            {educationItems.map((item) => (
              <span key={item.title}>
                {item.title}, {item.details.join(" ")}
              </span>
            ))}
          </dd>
        </div>
      </dl>
    </section>
  );
}
