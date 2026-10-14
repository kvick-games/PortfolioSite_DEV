import { Link, useSearchParams } from "react-router-dom";
import { ArticleCover } from "../components/ArticlePrimitives";
import { getPortfolioProject, portfolioProjects } from "../data/portfolioProjects";
import HomePage from "./HomePage";

export default function PortfolioPage() {
  const [params] = useSearchParams();
  const slug = params.get("project");
  if (slug === null) return <HomePage />;
  const project = getPortfolioProject(slug);
  if (!project)
    return (
      <main id="main" tabIndex={-1} className="page-shell">
        <Link className="back-button" to="/portfolio">
          Back to work
        </Link>
        <h1>Project not found</h1>
        <p>Choose a project from the portfolio.</p>
      </main>
    );
  const Article = project.Article;
  const index = portfolioProjects.indexOf(project);
  const next = portfolioProjects[(index + 1) % portfolioProjects.length];
  return (
    <main id="main" tabIndex={-1} className="page-shell case-study">
      <ArticleCover.Provider
        value={{ src: project.backgroundImage, alt: `${project.cardTitle}` }}
      >
        <Article />
      </ArticleCover.Provider>
      <nav className="case-next" aria-label="More work">
        <Link className="case-next-link" to={`/portfolio?project=${next.slug}`}>
          <span className="meta">Next project</span>
          <span className="case-next-title">{next.cardTitle}</span>
        </Link>
        <Link className="text-link" to="/portfolio#work">
          All work
        </Link>
      </nav>
    </main>
  );
}
