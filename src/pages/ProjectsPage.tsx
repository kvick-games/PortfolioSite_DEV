import { Link, useSearchParams } from "react-router-dom";
import { miscProjects, getMiscProject } from "../data/miscProjects";
export default function ProjectsPage() {
  const [params] = useSearchParams();
  const slug = params.get("project");
  const project = getMiscProject(slug);
  if (slug !== null) {
    const Article = project?.Article;
    return (
      <main id="main" tabIndex={-1} className="page-shell case-study">
        <Link className="back-button" to="/projects">
          Back to experiments
        </Link>
        {Article ? <Article /> : <h1>Project not found</h1>}
      </main>
    );
  }
  return (
    <main id="main" tabIndex={-1} className="page-shell">
      <section className="page-intro">
        <h1 className="page-title" data-reveal>Small experiments</h1>
        <p className="statement" data-reveal>
          Audio-reactive sketches, generative art, and tools for making sense of
          things.
        </p>
      </section>
      <div className="experiments-list">
        {miscProjects.map((project) => (
          <article
            className={
              project.image ? "experiment" : "experiment experiment--text"
            }
            key={project.slug}
            data-reveal
          >
            {project.image ? (
              <img src={project.image} alt={project.title} loading="lazy" />
            ) : null}
            <div>
              <h2>
                {project.title === "Generative Art Experiments"
                  ? "Generative art"
                  : project.title}
              </h2>
              <p>{project.subtitle}</p>
              <p>{project.details.join(", ")}</p>
              <Link className="text-link" to={`/projects?project=${project.slug}`}>
                View experiment
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
