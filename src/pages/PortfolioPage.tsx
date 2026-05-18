import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getPortfolioProject, portfolioProjects } from "../data/portfolioProjects";
import type { PortfolioProject, ProjectCategory } from "../data/types";

const categories: Array<{
  key: ProjectCategory;
  title: string;
  description: string;
}> = [
  {
    key: "games",
    title: "Games",
    description: "Commercial titles, independent work, and real-time development tools.",
  },
  {
    key: "web-tools",
    title: "Web / Tools",
    description: "Small public tools and visual interfaces.",
  },
];

function PortfolioCard({
  project,
  onSelect,
  disabled,
  entryNumber,
}: {
  project: PortfolioProject;
  onSelect: (slug: string) => void;
  disabled: boolean;
  entryNumber: number;
}) {
  const formattedNumber = entryNumber.toString().padStart(2, "0");

  return (
    <li className={project.featured ? "portfolio-item portfolio-item--featured" : "portfolio-item"}>
      <button
        className="portfolio-card"
        type="button"
        onClick={() => onSelect(project.slug)}
        disabled={disabled}
        aria-label={`Open ${project.title} case study`}
      >
        <span
          className="portfolio-card-media"
          aria-hidden="true"
          style={{ backgroundImage: `url(${project.cardImage})` }}
        />
        <span className="portfolio-card-topline">
          <span className="portfolio-card-number">{formattedNumber}</span>
          <span className="portfolio-card-type">{project.category === "games" ? "Game" : "Web Tool"}</span>
        </span>
        <span className="portfolio-card-label">
          <span className="portfolio-card-title">{project.cardTitle}</span>
          <span className="portfolio-card-subtitle">{project.subtitle}</span>
        </span>
        <span className="portfolio-card-footer">
          <span className="portfolio-card-detail-list">
            {project.details.slice(0, 3).map((detail) => (
              <span key={detail}>{detail}</span>
            ))}
          </span>
          <span className="portfolio-card-action">View case study</span>
        </span>
      </button>
    </li>
  );
}

function PortfolioOverview({
  onSelect,
  isHidden,
}: {
  onSelect: (slug: string) => void;
  isHidden: boolean;
}) {
  return (
    <div className="portfolio-overview-panel" aria-hidden={isHidden}>
      <section className="portfolio-overview" aria-labelledby="portfolio-overview-title">
        <div>
          <p className="kicker">Selected work</p>
          <h1 id="portfolio-overview-title">Gameplay, tools, and interface systems.</h1>
        </div>
        <div className="portfolio-focus-list" aria-label="Portfolio focus areas">
          <span>AAA UI</span>
          <span>Independent Games</span>
          <span>Procedural Tools</span>
          <span>Web Experiments</span>
        </div>
      </section>

      <div className="portfolio-categories">
        {categories.map((category) => {
          const projects = portfolioProjects.filter((project) => project.category === category.key);

          return (
            <section
              key={category.key}
              className={
                category.key === "games"
                  ? "portfolio-category portfolio-category--primary"
                  : "portfolio-category"
              }
              aria-labelledby={`portfolio-category-${category.key}`}
            >
              <div className="portfolio-category-copy">
                <h2 id={`portfolio-category-${category.key}`}>{category.title}</h2>
                <p>{category.description}</p>
              </div>
              <ul className="portfolio-grid">
                {projects.map((project) => (
                  <PortfolioCard
                    key={project.slug}
                    project={project}
                    onSelect={onSelect}
                    disabled={isHidden}
                    entryNumber={
                      portfolioProjects.findIndex((candidate) => candidate.slug === project.slug) + 1
                    }
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ProjectPanel({
  project,
  requestedSlug,
  onClose,
}: {
  project: PortfolioProject | null;
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
          Back to portfolio
        </button>
        <h1>Project not found</h1>
        <p>
          No portfolio piece matches <code>{requestedSlug}</code>. Return to the portfolio grid
          and choose a project from the current set.
        </p>
      </section>
    );
  }

  const Article = project.Article;

  return (
    <section className="project-panel-content" aria-live="polite">
      <button className="back-button" type="button" onClick={onClose}>
        Back to portfolio
      </button>
      <Article />
    </section>
  );
}

export default function PortfolioPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSlug = searchParams.get("project");
  const selectedProject = getPortfolioProject(selectedSlug);
  const hasProjectQuery = selectedSlug !== null;
  const backgroundImage = selectedProject?.backgroundImage ?? "/Resources/Projects/EWA/5.png";
  const projectClass = selectedProject ? `portfolio-page--${selectedProject.slug}` : "";
  const backgroundClass = selectedProject
    ? `fixed-project-background fixed-project-background--${selectedProject.slug}`
    : "fixed-project-background";

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
    <main className={`page-shell portfolio-page ${projectClass}`.trim()}>
      <div
        className={backgroundClass}
        aria-hidden="true"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className={hasProjectQuery ? "portfolio-stage portfolio-stage--article" : "portfolio-stage"}>
        <PortfolioOverview onSelect={handleSelect} isHidden={hasProjectQuery} />
        <div className="portfolio-article-panel" aria-hidden={!hasProjectQuery}>
          <ProjectPanel project={selectedProject} requestedSlug={selectedSlug} onClose={handleClose} />
        </div>
      </div>
    </main>
  );
}
