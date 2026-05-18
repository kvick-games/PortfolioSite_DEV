import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getMiscProject, miscProjects } from "../data/miscProjects";
import type { MiscProject } from "../data/types";

function ProjectCard({
  project,
  onSelect,
  disabled,
  entryNumber,
}: {
  project: MiscProject;
  onSelect: (slug: string) => void;
  disabled: boolean;
  entryNumber: number;
}) {
  const formattedNumber = entryNumber.toString().padStart(2, "0");

  return (
    <li className="portfolio-item">
      <button
        className="portfolio-card portfolio-card--compact"
        type="button"
        onClick={() => onSelect(project.slug)}
        disabled={disabled}
        aria-label={`Open ${project.title} article`}
      >
        <span
          className="portfolio-card-media"
          aria-hidden="true"
          style={{ backgroundImage: `url(${project.image})` }}
        />
        <span className="portfolio-card-topline">
          <span className="portfolio-card-number">{formattedNumber}</span>
          <span className="portfolio-card-type">Project</span>
        </span>
        <span className="portfolio-card-label">
          <span className="portfolio-card-title">{project.title}</span>
          <span className="portfolio-card-subtitle">{project.subtitle}</span>
        </span>
        <span className="portfolio-card-footer">
          <span className="portfolio-card-detail-list">
            {project.details.slice(0, 3).map((detail) => (
              <span key={detail}>{detail}</span>
            ))}
          </span>
          <span className="portfolio-card-action">View article</span>
        </span>
      </button>
    </li>
  );
}

function ProjectsOverview({
  onSelect,
  isHidden,
}: {
  onSelect: (slug: string) => void;
  isHidden: boolean;
}) {
  return (
    <div className="portfolio-overview-panel" aria-hidden={isHidden}>
      <section className="page-intro" aria-labelledby="projects-title">
        <p className="kicker">Web experiments</p>
        <h1 id="projects-title">Small tools, sketches, and public interfaces.</h1>
      </section>

      <ul className="misc-project-grid">
        {miscProjects.map((project, index) => (
          <ProjectCard
            key={project.slug}
            project={project}
            onSelect={onSelect}
            disabled={isHidden}
            entryNumber={index + 1}
          />
        ))}
      </ul>
    </div>
  );
}

function ProjectPanel({
  project,
  requestedSlug,
  onClose,
}: {
  project: MiscProject | null;
  requestedSlug: string | null;
  onClose: () => void;
}) {
  if (requestedSlug === null) {
    return null;
  }

  if (!project) {
    return (
      <section className="project-panel-content project-panel-content--empty" aria-live="polite">
        <button className="back-button" type="button" onClick={onClose}>
          Back to projects
        </button>
        <h1>Project not found</h1>
        <p>
          No project matches <code>{requestedSlug}</code>. Return to the projects grid and
          choose a project from the current set.
        </p>
      </section>
    );
  }

  const Article = project.Article;

  return (
    <section className="project-panel-content" aria-live="polite">
      <button className="back-button" type="button" onClick={onClose}>
        Back to projects
      </button>
      <Article />
    </section>
  );
}

export default function ProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSlug = searchParams.get("project");
  const selectedProject = getMiscProject(selectedSlug);
  const hasProjectQuery = selectedSlug !== null;
  const backgroundImage = selectedProject?.image ?? "/Resources/Projects/Misc/misc_bg.jpg";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [selectedSlug]);

  const handleSelect = (slug: string) => {
    setSearchParams({ project: slug });
  };

  const handleClose = () => {
    setSearchParams({});
  };

  return (
    <main className="page-shell projects-page">
      <div
        className="fixed-project-background"
        aria-hidden="true"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className={hasProjectQuery ? "portfolio-stage portfolio-stage--article" : "portfolio-stage"}>
        <ProjectsOverview onSelect={handleSelect} isHidden={hasProjectQuery} />
        <div className="portfolio-article-panel" aria-hidden={!hasProjectQuery}>
          <ProjectPanel project={selectedProject} requestedSlug={selectedSlug} onClose={handleClose} />
        </div>
      </div>
    </main>
  );
}
