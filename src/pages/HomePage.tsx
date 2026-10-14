import Brand from "../components/Brand";
import { Link } from "react-router-dom";
import MenuViewer, { type MenuView } from "../components/MenuViewer";
import PaintingRows from "../components/PaintingRows";
import { artPieces } from "../data/artPieces";
import { contact, resumes } from "../data/site";

const img = (name: string) => `/Resources/Site/img/${name}.webp`;

const godOfWarViews: MenuView[] = [
  {
    id: "skills",
    label: "Skills",
    video: "/Resources/Site/loops/gow-Skills.mp4",
    poster: "/Resources/Site/loops/gow-Skills.webp",
    alt: "God of War skill tree menu footage",
    caption:
      "I prototyped the skill tree’s free-moving cursor, with magnetism and snapping, in Unity and pitched it to the technical director. I also integrated Bink video so every skill shows its move.",
  },
  {
    id: "map",
    label: "Map",
    video: "/Resources/Site/loops/gow-Map.mp4",
    poster: "/Resources/Site/loops/gow-Map.webp",
    alt: "God of War map menu footage",
    caption:
      "The menus were built in Lua and C++ in Sony’s engine. I built the camera and UI blending systems that animate them, and the state machines behind each screen.",
  },
  {
    id: "codex",
    label: "Goals and Codex",
    video: "/Resources/Site/loops/gow-Codex.mp4",
    poster: "/Resources/Site/loops/gow-Codex.webp",
    alt: "God of War goals and codex menu footage",
    caption:
      "Through rounds of playtesting we reworked the whole menu flow until players could find their way without getting lost.",
  },
  {
    id: "weapons",
    label: "Weapons",
    poster: img("gow-gow-ui-weapons-01"),
    alt: "God of War weapons menu",
    caption:
      "The inventory was rearranged many times. Weapons and armor eventually became separate tabs, so players could read a lot of information at a glance.",
  },
  {
    id: "armor",
    label: "Armor",
    poster: img("gow-gow-ui-armor-01"),
    alt: "God of War armor menu",
    caption:
      "Modular widgets let us reuse pieces and recombine them for menus with similar item structures.",
  },
];

const paintingSlugs = [
  "gold",
  "get-kraken",
  "amber",
  "blue-noise",
  "redblue",
  "the-tower",
  "memory",
  "fallen",
  "super",
];
const paintings = paintingSlugs.map(
  (slug) => artPieces.find((piece) => piece.slug === slug)!,
);

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <h1 id="hero-title" className="display" data-reveal>
        Interfaces for games <span>and creative tools</span>
      </h1>
      <div className="hero-lede">
        <p className="statement" data-reveal>
          I’m Michael Nevins. I designed and built menu systems for God of War
          (2018), UI at Ghost Story Games, and now creative software at{" "}
          <Brand />. I also paint.
        </p>
        <div className="hero-actions" data-reveal>
          <a className="button" href={contact.href} target="_blank" rel="noreferrer">
            {contact.label}
          </a>
          <a className="text-link" href="#work">
            See the work
          </a>
        </div>
      </div>
    </section>
  );
}

function GodOfWar() {
  return (
    <section className="chapter chapter--gow" id="work" aria-labelledby="gow-title">
      <MenuViewer
        views={godOfWarViews}
        label="gow"
        credit="God of War (2018) © Sony Interactive Entertainment. Shown to illustrate my work on the UI team."
      >
        <h2 id="gow-title" className="chapter-title">
          God of War
        </h2>
        <p className="meta">
          Sony Santa Monica Studio
          <br />
          Associate Technical UI Designer, 2016–2018
        </p>
        <p>
          On a team of more than 350, I was largely responsible for the
          technical design and implementation of the primary game menu.
        </p>
      </MenuViewer>
      <div className="chapter-foot">
        <Link className="text-link" to="/portfolio?project=god-of-war">
          More on God of War
        </Link>
      </div>
    </section>
  );
}

function Judas() {
  return (
    <section className="chapter chapter--judas" aria-labelledby="judas-title">
      <figure className="judas-image" data-reveal>
        <img
          src={img("projects-judas-img2")}
          alt="Still from the Judas reveal trailer"
          loading="lazy"
        />
      </figure>
      <div className="judas-copy">
        <h2 id="judas-title" className="chapter-title" data-reveal>
          Judas
        </h2>
        <p className="meta" data-reveal>
          Ghost Story Games
          <br />
          User Interface Design Scripter, 2018–2020
        </p>
        <p data-reveal>
          An unreleased first-person immersive sim from the makers of BioShock.
          I worked on its user interface and gameplay systems in Unreal Engine
          4, with UMG and C++.
        </p>
        <a
          className="text-link"
          href="https://www.youtube.com/watch?v=FoLJ4HgWqw4"
          target="_blank"
          rel="noreferrer"
          data-reveal
        >
          Watch the reveal trailer on YouTube
        </a>
      </div>
    </section>
  );
}

function Tanuki() {
  return (
    <section className="chapter chapter--tanuki" aria-labelledby="tanuki-title">
      <header className="chapter-head">
        <h2 id="tanuki-title" className="chapter-title" data-reveal>
          Tanuki
        </h2>
        <p className="meta" data-reveal>
          <Brand />, founder
          <br />
          2020 to now, Unreal Engine
        </p>
        <p className="statement" data-reveal>
          An unreleased game about running a restaurant in a world that
          simulates itself. I build its systems and the interface over them.
        </p>
      </header>
      <div className="tanuki-grid">
        <figure className="tanuki-world" data-reveal>
          <img src={img("tanuki-2")} alt="A tanuki looks out over a misty village" loading="lazy" />
        </figure>
        <figure data-reveal>
          <img src={img("tanuki-questcomplete")} alt="Quest complete banner over a dialogue box" loading="lazy" />
        </figure>
        <figure data-reveal>
          <img src={img("tanuki-screenshot-cooking-01")} alt="Cooking station with ingredients" loading="lazy" />
        </figure>
      </div>
      <div className="tanuki-notes">
        <p data-reveal>
          <strong>Recipes ask for qualities, not items.</strong> A dish can
          require a grilled carrot, any grilled vegetable, or a carrot of any
          quality, so cooking stays open-ended.
        </p>
        <p data-reveal>
          <strong>Everything has a state.</strong> Day and night, weather and
          seasons feed simulation components on any actor, down to an apple
          ripening on a tree.
        </p>
        <p data-reveal>
          <strong>NPCs weigh their choices.</strong> A general utility scoring
          system decides how visitors behave, and it carries across projects.
        </p>
      </div>
      <div className="chapter-foot">
        <Link className="text-link" to="/portfolio?project=tanuki">
          More on Tanuki
        </Link>
      </div>
    </section>
  );
}

function Ewa() {
  return (
    <section className="chapter chapter--ewa field-night" aria-labelledby="ewa-title">
      <div className="ewa-grid">
        <header className="ewa-copy">
          <h2 id="ewa-title" className="chapter-title" data-reveal>
            EWA
          </h2>
          <p className="meta" data-reveal>
            Solo project
            <br />
            2020 to now, Unreal Engine
          </p>
          <p className="statement" data-reveal>
            A third-person horror game with fixed cameras, puzzles and a grid
            inventory. Its rooms began as my paintings.
          </p>
          <Link className="text-link" to="/portfolio?project=ewa" data-reveal>
            Watch the teaser and see more
          </Link>
        </header>
        <figure className="ewa-portrait" data-reveal>
          <img src={img("ewa-ewa-redacted")} alt="Red key art of a figure with redacted eyes" loading="lazy" />
        </figure>
        <figure className="ewa-wide" data-reveal>
          <img src={img("ewa-ewa-concept-01")} alt="Concept painting of a burning furnace room" loading="lazy" />
          <figcaption>Concept painting, the furnace room</figcaption>
        </figure>
        <figure className="ewa-shot ewa-shot--a" data-reveal>
          <img src={img("ewa-1")} alt="In-engine screenshot of a dim, lamp-lit room" loading="lazy" />
        </figure>
        <figure className="ewa-shot ewa-shot--b" data-reveal>
          <img src={img("ewa-4")} alt="In-engine screenshot of a desk lamp in a dark hall" loading="lazy" />
        </figure>
      </div>
    </section>
  );
}

function Tools() {
  return (
    <section className="chapter chapter--tools" aria-labelledby="levelgen-title">
      <div className="levelgen">
        <div className="levelgen-copy">
          <h2 id="levelgen-title" className="chapter-title" data-reveal>
            Level Generator
          </h2>
          <p className="meta" data-reveal>
            Solo technical demo
            <br />
            2023, Unreal Engine 5
          </p>
          <p data-reveal>
            A year of building a procedural level generator. It first creates
            an abstract, serializable map, then builds the level from it.
            Themes are modular objects every phase can consult.
          </p>
          <p data-reveal>
            It works with gameplay rather than beside it: when the quest system
            asks for an objective, the generator makes a room to hold it.
          </p>
          <Link className="text-link" to="/portfolio?project=level-generator" data-reveal>
            More on the Level Generator
          </Link>
        </div>
        <figure className="levelgen-pipeline" data-reveal>
          <img src={img("levelgenerator-mapgenpipeline")} alt="Diagram of the generation pipeline" loading="lazy" />
        </figure>
        <ul className="levelgen-rooms" aria-label="Generated levels">
          {[
            ["levelgenerator-1", "Generated interior with wood floors"],
            ["levelgenerator-2", "Generated kitchen with peeling tiles"],
            ["levelgenerator-5", "Generated hallway with a lit doorway"],
            ["levelgenerator-3", "Exterior of a generated structure"],
          ].map(([name, alt]) => (
            <li key={name} data-reveal>
              <img src={img(name)} alt={alt} loading="lazy" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Dreamatron() {
  return (
    <section
      className="chapter chapter--dreamatron field-accent"
      id="dreamatron"
      aria-labelledby="dreamatron-title"
    >
      <h2 id="dreamatron-title" className="wordmark-giant" data-reveal>
        <Brand />
      </h2>
      <p className="statement dreamatron-intro" data-reveal>
        <Brand /> is the studio I founded. Alongside our games, I’m
        designing and building creative applications for film, sound and
        games, and the interfaces that hold them together.
      </p>
      <div className="dreamatron-live">
        <figure data-reveal>
          <a
            href="https://www.dreamatron.ai/timeline"
            target="_blank"
            rel="noreferrer"
            aria-label="Open the AI Timeline at dreamatron.ai"
          >
            <img
              src={img("dreamatron-timeline")}
              alt="The AI Timeline: release lines for OpenAI, Anthropic, Google and others, with glowing release markers and gap labels"
              loading="lazy"
            />
          </a>
        </figure>
        <div className="dreamatron-live-copy">
          <h3 data-reveal>AI Timeline</h3>
          <p className="meta" data-reveal>
            Live at dreamatron.ai, 2026
          </p>
          <p data-reveal>
            A map of AI progress, from model releases and generative media to
            voice, world models, coding tools and robotics. The board pans like
            a canvas with a zoom rail, and every gap is measured against its
            line’s average. It grew out of my earlier{" "}
            <Link to="/portfolio?project=ai-model-timeline">model timeline</Link>.
          </p>
          <a
            className="text-link"
            href="https://www.dreamatron.ai/timeline"
            target="_blank"
            rel="noreferrer"
            data-reveal
          >
            Open the timeline
          </a>
        </div>
      </div>
      <div className="dreamatron-private">
        <div className="dreamatron-auteur">
          <h3 data-reveal>DT_Auteur, in private preview</h3>
          <p data-reveal>
            One editor for video, audio and MIDI. Still in development, and not
            public yet.
          </p>
          <ul>
            <li data-reveal>Director’s notes pinned to a moment or a range of the timeline</li>
            <li data-reveal>Audio warping with separate lanes for timing, bounds and markers</li>
            <li data-reveal>A compact inspector that opens effect controls in place</li>
          </ul>
        </div>
        <div className="dreamatron-door" data-reveal>
          <a className="button button--ink" href="/studio/">
            Open the client preview
          </a>
          <p>
            Unreleased interface work, shared with invited clients by password.
            Ask me for access.
          </p>
        </div>
      </div>
    </section>
  );
}

function Paintings() {
  return (
    <section className="chapter chapter--paint" aria-labelledby="paint-title">
      <header className="paint-head">
        <h2 id="paint-title" className="chapter-title" data-reveal>
          Paintings
        </h2>
        <p className="statement" data-reveal>
          I trained in illustration and fine art before I learned to program.
          I still paint characters, rooms, and the occasional sea monster.
        </p>
      </header>
      <PaintingRows pieces={paintings} />
      <div className="chapter-foot">
        <Link className="text-link" to="/art">
          See all {artPieces.length} paintings
        </Link>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="chapter chapter--about" aria-labelledby="about-title">
      <h2 id="about-title" className="chapter-title" data-reveal>
        Teams of 350 and teams of one
      </h2>
      <div className="about-columns">
        <div className="about-text">
          <p data-reveal>
            I studied illustration and fine art at the Academy of Art
            University in San Francisco, then moved into game programming. I’m
            happiest where the two overlap: the screens, systems and tools
            players and makers actually touch.
          </p>
          <p data-reveal>
            I write C++, Lua, Python, C# and TypeScript, and work in Unreal,
            Unity, Houdini and Blender. Lately I’m most interested in
            procedural generation and in tools that take repetitive work off a
            team’s plate.
          </p>
        </div>
        <div className="about-links" data-reveal>
          <a className="button" href={contact.href} target="_blank" rel="noreferrer">
            {contact.label}
          </a>
          <ul>
            {resumes.map((resume) => (
              <li key={resume.href}>
                <a className="text-link" href={resume.href} target="_blank" rel="noreferrer">
                  {resume.label}
                </a>
              </li>
            ))}
            <li>
              <Link className="text-link" to="/about">
                More about me
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main id="main" tabIndex={-1} className="home">
      <Hero />
      <GodOfWar />
      <Judas />
      <Tanuki />
      <Ewa />
      <Tools />
      <Dreamatron />
      <Paintings />
      <About />
    </main>
  );
}
