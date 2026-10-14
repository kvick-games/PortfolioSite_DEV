import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  getPortfolioProject,
  portfolioProjects,
} from "../data/portfolioProjects";
import { artPieces } from "../data/artPieces";
const gold = artPieces.find((piece) => piece.slug === "gold")!;
const artSelection = ["gold", "red-hall", "fallen", "blue-noise"].map((slug) =>
  artPieces.find((piece) => piece.slug === slug)!,
);
const projectCopy: Record<string, string> = {
  "god-of-war":
    "Technical design and implementation of the primary game menu at Sony Santa Monica Studio.",
  judas:
    "User interface and gameplay systems at Ghost Story Games, built in Unreal Engine.",
  "level-generator":
    "A year of exploring how rooms, rules, and themes can grow into playable spaces.",
  tanuki:
    "An independent world built around simulation, from its inhabitants to its everyday rituals.",
  ewa: "A solo adventure horror project, bringing together exploration, puzzles, and fixed-camera storytelling.",
  "ai-model-timeline":
    "A public, interactive map of AI model and coding-tool releases, built with React and TypeScript.",
};
function Overview() {
  const [preview, setPreview] = useState({
    src: gold.coverImage,
    title: "Gold",
    detail: "A painting by Michael Nevins",
    href: "/art?piece=gold",
  });
  const [selectedArt, setSelectedArt] = useState(gold);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.find((item) => item.isIntersecting);
        if (!entry) return;
        const project = getPortfolioProject(
          entry.target.getAttribute("data-project"),
        );
        if (project)
          setPreview({
            src: project.cardImage,
            title: project.cardTitle,
            detail: project.details[0],
            href: `/portfolio?project=${project.slug}`,
          });
        else
          setPreview({
            src: gold.coverImage,
            title: "Gold",
            detail: "A painting by Michael Nevins",
            href: "/art?piece=gold",
          });
      },
      { rootMargin: "-15% 0px -55% 0px", threshold: 0 },
    );
    document
      .querySelectorAll("[data-project], .home-hero, .gallery-feature")
      .forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);
  return (
    <main id="main" tabIndex={-1} className="home-layout">
      <aside className="image-stage" aria-label="Selected work preview">
        <Link to={preview.href} className="stage-picture">
          <img
            key={preview.src}
            src={preview.src}
            alt={preview.title}
            fetchPriority="high"
          />
        </Link>
        <div className="stage-caption" aria-live="polite">
          <span>{preview.title}</span>
          <span>{preview.detail}</span>
        </div>
      </aside>
      <div className="home-content">
        <section className="home-hero" aria-labelledby="home-title">
          <h1 id="home-title" data-reveal>
            Michael
            <br />
            Nevins
          </h1>
          <p className="hero-description" data-reveal>
            Game developer, technical designer, and artist. I make worlds and
            the systems that bring them to life.
          </p>
          <a
            className="button primary-action"
            href="#selected-work"
            data-reveal
          >
            Explore my work <span aria-hidden="true">↓</span>
          </a>
          <p className="hero-context" data-reveal>
            Previously Sony Santa Monica and Ghost Story Games. Now building
            Dreamatron.
          </p>
        </section>
        <section
          className="work-section"
          id="selected-work"
          aria-labelledby="work-title"
        >
          <h2 id="work-title" data-reveal>
            Selected work
          </h2>
          <p data-reveal>
            A closer look at what I built, how it works, and the thinking behind
            it.
          </p>
          <div className="work-index">
            {portfolioProjects.map((project) => (
              <article
                key={project.slug}
                className="work-entry"
                data-project={project.slug}
                data-reveal
              >
                <Link
                  to={`/portfolio?project=${project.slug}`}
                  className="work-link"
                  onMouseEnter={() =>
                    setPreview({
                      src: project.cardImage,
                      title: project.cardTitle,
                      detail: project.details[0],
                      href: `/portfolio?project=${project.slug}`,
                    })
                  }
                  onFocus={() =>
                    setPreview({
                      src: project.cardImage,
                      title: project.cardTitle,
                      detail: project.details[0],
                      href: `/portfolio?project=${project.slug}`,
                    })
                  }
                >
                  <img
                    className="work-thumbnail"
                    src={project.cardImage}
                    alt=""
                    loading="lazy"
                  />
                  <div>
                    <h3>
                      {project.slug === "level-generator"
                        ? "Level Generator"
                        : project.cardTitle}
                    </h3>
                    <p className="work-role">
                      {project.slug === "ewa"
                        ? "Independent development"
                        : project.details[1]}
                      <span>
                        {project.slug === "ewa"
                          ? project.details[1]
                          : project.details[2]}
                      </span>
                    </p>
                  </div>
                  <p>{projectCopy[project.slug]}</p>
                  <span className="text-link">View project</span>
                </Link>
                {project.slug === "god-of-war" ? (
                  <figure className="home-video">
                    <video
                      controls
                      playsInline
                      preload="none"
                      poster="/Resources/Projects/GoW/andy-lang-andylang5-skilltree.jpg"
                      aria-label="God of War skills menu demonstration"
                    >
                      <source
                        src="/Resources/Projects/GoW/God-of-War-UI_Menu_Skills.mp4"
                        type="video/mp4"
                      />
                    </video>
                  </figure>
                ) : null}
              </article>
            ))}
          </div>
        </section>
        <section
          className="dreamatron-section"
          aria-labelledby="dreamatron-title"
        >
          <h2 id="dreamatron-title" data-reveal>
            Building Dreamatron
          </h2>
          <p data-reveal>
            I’m developing a family of creative applications, with hands-on work
            across interface design, interaction, and implementation.
          </p>
          <p data-reveal>
            DT_Auteur brings video, audio, and MIDI into one editing workspace.
            The apps are still in development. Selected UI studies are available
            privately for client conversations.
          </p>
          <a className="button" href="/studio/" data-reveal>
            Private UI showcase
          </a>
        </section>
        <section className="gallery-feature" aria-labelledby="gallery-title">
          <h2 id="gallery-title" data-reveal>
            Another side
          </h2>
          <p data-reveal>
            Painting is where it started. Characters, strange places, and the
            occasional experiment in motion.
          </p>
          <Link
            className="gallery-selected"
            to={`/art?piece=${selectedArt.slug}`}
            data-reveal
          >
            <img
              key={selectedArt.slug}
              src={selectedArt.coverImage}
              alt={selectedArt.title}
              loading="lazy"
            />
          </Link>
          <div
            className="art-picker"
            aria-label="Choose a painting"
            data-reveal
          >
            {artSelection.map((piece) => (
              <button
                key={piece.slug}
                type="button"
                aria-label={`Preview ${piece.title}`}
                aria-pressed={piece.slug === selectedArt.slug}
                onClick={() => {
                  setSelectedArt(piece);
                  setPreview({
                    src: piece.coverImage,
                    title: piece.title,
                    detail: "A painting by Michael Nevins",
                    href: `/art?piece=${piece.slug}`,
                  });
                }}
              >
                <img src={piece.coverImage} alt="" loading="lazy" />
              </button>
            ))}
          </div>
          <div className="gallery-caption">
            <span aria-live="polite">{selectedArt.title}</span>
            <Link className="text-link" to="/art">
              View all artwork
            </Link>
          </div>
        </section>
        <section className="home-about" aria-labelledby="about-heading">
          <h2 id="about-heading" data-reveal>
            Art meets systems
          </h2>
          <p data-reveal>
            I started in illustration and fine art, then moved into game
            programming. I’m drawn to the places where the two overlap.
          </p>
          <p data-reveal>
            My work spans primary menus on God of War, UI and gameplay on Judas,
            and independent projects at Dreamatron. These days, procedural
            generation is a particular interest: giving teams more room to
            design by making the repetitive work easier.
          </p>
          <div className="about-actions" data-reveal>
            <Link className="button" to="/about">
              More about me
            </Link>
            <a
              className="text-link"
              href="/Resources/Michael_Nevins_Resume_GameplayProgrammer.pdf"
              target="_blank"
              rel="noreferrer"
            >
              Read my résumé
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
export default function PortfolioPage() {
  const [params] = useSearchParams();
  const slug = params.get("project");
  if (slug === null) return <Overview />;
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
  return (
    <main id="main" tabIndex={-1} className="page-shell case-study">
      <Link className="back-button" to="/portfolio">
        Back to work
      </Link>
      <img
        className="case-cover"
        src={project.backgroundImage}
        alt={`${project.cardTitle} project`}
      />
      <Article />
    </main>
  );
}
