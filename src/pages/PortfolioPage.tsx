import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CaseHead } from "../components/CaseStudy";
import { getPortfolioProject, portfolioProjects } from "../data/portfolioProjects";
import HomePage from "./HomePage";

export default function PortfolioPage() {
  const [params] = useSearchParams();
  const slug = params.get("project");
  const project = getPortfolioProject(slug);

  // After App's own title effect, which only knows the path.
  useEffect(() => {
    if (project) document.title = `Michael Nevins | ${project.cardTitle}`;
  }, [project]);

  if (slug === null) return <HomePage />;
  if (!project)
    return (
      <main id="main" tabIndex={-1} className="case">
        <header className="chapter-head case-head">
          <h1 className="chapter-title case-title">Project not found</h1>
          <p className="statement">That project isn&rsquo;t here. Choose one from the work.</p>
        </header>
        <Link className="text-link" to="/portfolio#work">
          All work
        </Link>
      </main>
    );

  const Article = project.Article;
  const index = portfolioProjects.indexOf(project);
  const count = portfolioProjects.length;
  const previous = portfolioProjects[(index - 1 + count) % count];
  const next = portfolioProjects[(index + 1) % count];

  // Keyed by project, so moving between projects starts fresh: images fade
  // in again and footage resets, inside the route cross-fade.
  return (
    <main id="main" tabIndex={-1} className="case" key={project.slug}>
      <CaseHead title={project.title} details={project.details} statement={project.statement} />
      {project.hero}
      <Article />
      <nav className="case-pager" aria-label="More work">
        <Link className="case-pager-link" to={`/portfolio?project=${previous.slug}`} data-reveal>
          <span className="meta">Previous project</span>
          <span className="case-pager-title">{previous.cardTitle}</span>
        </Link>
        <Link
          className="case-pager-link case-pager-link--next"
          to={`/portfolio?project=${next.slug}`}
          data-reveal
        >
          <span className="meta">Next project</span>
          <span className="case-pager-title">{next.cardTitle}</span>
        </Link>
        <Link className="text-link case-pager-all" to="/portfolio#work">
          All work
        </Link>
      </nav>
    </main>
  );
}
