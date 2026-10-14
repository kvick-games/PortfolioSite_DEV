import Brand from "../components/Brand";
import ResumeDocument from "../components/ResumeDocument";

export default function AboutPage() {
  return (
    <main id="main" tabIndex={-1} className="page-shell about-page">
      <section className="page-intro about-intro" aria-labelledby="about-title">
        <h1 id="about-title" className="page-title" data-reveal>
          Art, code, curiosity
        </h1>
      </section>

      <section className="about-layout" aria-label="Biography and resume">
        <div className="about-copy">
          <p>
            I’m a game developer and an artist at heart. I built menu systems
            for God of War (2018), worked on UI and gameplay systems at Ghost
            Story Games, and founded <Brand />.
          </p>
          <p>
            Most of my work now is AI experimentation: finding out what models
            can really do, then building the tools to put them to work. At{" "}
            <Brand /> that means <Brand name="Dream Engine" />, the engine Tanuki
            and EWA are built in, and creative applications for film, sound and
            games. The aim is to help build, and define, the next generation of
            games.
          </p>
          <p>
            I graduated with a Bachelor of Science in computer science, focused
            on game programming, after studying Illustration and Fine Art at the
            Academy of Art University in San Francisco, and later took
            Caltech’s AI and Machine Learning bootcamp.
          </p>
          <p>
            I write C++, C#, Python, Lua and TypeScript, and I’ve worked solo,
            in small teams, and on a team of more than 350 on God of War. The
            thread through all of it is the same: take tedious work off people
            so they can spend their time on the design.
          </p>
          <div className="social-links" aria-label="External profiles">
            <a
              href="https://www.linkedin.com/in/michael-nevins-690b3140/"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
            <a
              href="https://www.artstation.com/kvick"
              target="_blank"
              rel="noreferrer"
            >
              ArtStation
            </a>
            <a href="https://github.com/kvick-games" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href="https://x.com/kvickart" target="_blank" rel="noreferrer">
              X
            </a>
          </div>
        </div>

        <div className="resume-panel">
          <ResumeDocument />
        </div>
      </section>
    </main>
  );
}
