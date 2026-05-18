import ResumeDocument from "../components/ResumeDocument";

export default function AboutPage() {
  return (
    <main className="page-shell about-page">
      <section className="page-intro about-intro" aria-labelledby="about-title">
        <p className="kicker">About</p>
        <h1 id="about-title">Technical designer, artist, and game developer.</h1>
      </section>

      <section className="about-layout" aria-label="Biography and resume">
        <div className="about-copy">
          <p>
            I am a multi-disciplinary game developer currently working on an independent game
            project. I am an artist at heart and possess technical skills to bring anyone's
            vision to life.
          </p>
          <p>
            With a foundation in art and design, accompanied by strong technical chops, I can
            implement unusual ideas that need to be brought to life on a given day. My goal is
            to work on ambitious, innovative projects that ask for both creative and technical
            problem solving.
          </p>
          <p>
            I studied Illustration and Fine Art at Academy of Art University in San Francisco,
            CA. I later shifted my education toward a Bachelor of Science focused on game
            programming.
          </p>
          <p>
            I have experience across C++, C#, Python, JavaScript, and a broad range of game
            development domains. I have worked across solo projects, small teams, and teams of
            350+ people on God of War.
          </p>
          <p>
            Currently my main development interests lie in procedural generation and finding
            ways to reduce tedious development work so teams can focus more on the design of
            games.
          </p>
          <div className="social-links" aria-label="External profiles">
            <a href="https://www.linkedin.com/in/michael-nevins-690b3140/" target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <a href="https://www.artstation.com/kvick" target="_blank" rel="noreferrer">
              ArtStation
            </a>
            <a href="https://x.com/kvickart" target="_blank" rel="noreferrer">
              X
            </a>
          </div>
        </div>

        <aside className="resume-panel" aria-label="Resume">
          <h2>Resume</h2>
          <p>Gameplay programmer and technical designer resume.</p>
          <ResumeDocument />
        </aside>
      </section>
    </main>
  );
}
