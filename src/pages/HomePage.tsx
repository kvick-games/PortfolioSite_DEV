import Brand from "../components/Brand";
import EwaCameras, { type CameraShot } from "../components/EwaCameras";
import JudasTrailer from "../components/JudasTrailer";
import LayeredArt, { type ArtLayer } from "../components/LayeredArt";
import { Link } from "react-router-dom";
import LoopVideo from "../components/LoopVideo";
import LevelGenSketch from "../components/LevelGenSketch";
import MenuViewer, { type MenuView } from "../components/MenuViewer";
import PaintingRows from "../components/PaintingRows";
import ProjectSplash from "../components/ProjectSplash";
import ScrollRail from "../components/ScrollRail";
import ScrollWordmark from "../components/ScrollWordmark";
import SectionShaders from "../components/SectionShaders";
import TimelineMini from "../components/TimelineMini";
import { artPieces } from "../data/artPieces";
import { contact } from "../data/site";
import ResumeSummary from "../components/ResumeSummary";

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
  "red-hall",
  "memory",
  "fallen",
  "always-something-left-unsaid",
  "super",
  "white",
  "guardian",
  "furnace-room",
  "fear",
  "bloom",
  "genesis-prime",
  "midnight",
];
// The chosen pieces lead; every other painting follows in catalogue order.
const paintings = [
  ...paintingSlugs.map((slug) => artPieces.find((piece) => piece.slug === slug)!),
  ...artPieces.filter((piece) => !paintingSlugs.includes(piece.slug)),
];

function Hero() {
  return <ProjectSplash />;
}

const layer = (art: string, name: string, depth: number): ArtLayer => ({
  name,
  src: `/Resources/Site/img/layers/${art}/${name}.webp`,
  depth,
});

/** The key art split into a plate and the figures over it, for scroll parallax. */
const gowLayers = [
  layer("gow", "plate", 0),
  layer("gow", "troll", 0.6),
  layer("gow", "kratos", 0.55),
  layer("gow", "atreus", 0.6),
  { ...layer("gow", "logo", 0.6), rim: "/Resources/Site/img/layers/gow/logo-rim.webp" },
];
const judasLayers = [layer("judas", "plate", 0), layer("judas", "judas", 0.75)];

function GodOfWar() {
  return (
    <section className="chapter chapter--gow" id="work" aria-labelledby="gow-title">
      <figure className="gow-cover" data-reveal>
        <LayeredArt
          layers={gowLayers}
          width={2000}
          height={1125}
          alt="God of War (2018) key art: Kratos and Atreus fighting a troll in a burning forest"
        />
      </figure>
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
    <section className="chapter chapter--judas" id="judas" aria-labelledby="judas-title">
      <JudasTrailer
        className="judas-image"
        poster={img("projects-judas-img2")}
        layers={judasLayers}
        alt="Still from the Judas reveal trailer"
      />
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
          Open on YouTube
        </a>
      </div>
    </section>
  );
}

function Tanuki() {
  return (
    <section className="chapter chapter--tanuki" id="tanuki" aria-labelledby="tanuki-title">
      <header className="chapter-head">
        <h2 id="tanuki-title" className="chapter-title" data-reveal>
          Tanuki
        </h2>
        <p className="meta" data-reveal>
          <Brand />
          <br />
          <span className="meta-lead">Made with</span><Brand name="Dream Engine" />
        </p>
        <p className="statement" data-reveal>
          Become a master chef. Explore an island full of possibilities, make
          friends with the locals and cook them something unforgettable.
        </p>
      </header>
      <div className="tanuki-grid">
        <figure className="tanuki-world" data-reveal>
          <img src={img("tanuki-concept-island")} alt="Concept painting of the island from the air, a village on its shore" loading="lazy" />
        </figure>
        <figure data-reveal>
          <img src={img("tanuki-concept-shack")} alt="Concept painting of a mushroom-roofed shack" loading="lazy" />
        </figure>
        <figure data-reveal>
          <img src={img("tanuki-concept-hut")} alt="Concept painting of a hut in the forest" loading="lazy" />
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

const ewaCameraShots: CameraShot[] = [
  { src: img("ewa-1"), alt: "In-engine screenshot of a dim, lamp-lit room, the player by the door" },
  { src: img("ewa-4"), alt: "In-engine screenshot of a desk lamp in a dark hall" },
  { src: img("ewa-3"), alt: "In-engine screenshot looking down a narrow wooden corridor" },
  { src: img("ewa-5"), alt: "In-engine screenshot of a dark hall below a broken balcony" },
  { src: img("ewa-2"), alt: "In-engine screenshot of a television glowing with static in the dark" },
];

function Ewa() {
  return (
    <section className="chapter chapter--ewa field-night" id="ewa" aria-labelledby="ewa-title">
      <div className="ewa-grid">
        <header className="ewa-copy">
          <h2 id="ewa-title" className="chapter-title" data-reveal>
            EWA
          </h2>
          <p className="meta" data-reveal>
            <Brand />
            <br />
            <span className="meta-lead">Made with</span><Brand name="Dream Engine" />
          </p>
          <p className="statement" data-reveal>
            Deep in a frozen winter, people have started to vanish. Survive what waits in the dark and uncover the truth.
          </p>
          <Link className="text-link" to="/portfolio?project=ewa" data-reveal>
            Watch the teaser and see more
          </Link>
        </header>
        <figure className="ewa-portrait" data-reveal>
          <img src={img("ewa-ewa-redacted")} alt="Red key art of a figure with redacted eyes" loading="lazy" />
          <LoopVideo src="/Resources/Site/loops/ewa-portrait.mp4" />
        </figure>
        <figure className="ewa-wide" data-reveal>
          <img src={img("ewa-ewa-concept-01")} alt="Concept painting of a burning furnace room" loading="lazy" />
          <figcaption>Concept painting, the furnace room</figcaption>
        </figure>
        <EwaCameras
          shots={ewaCameraShots}
          caption={
            <>
              In engine.{" "}
              <span className="ewa-cams-hint-pointer">Move across the frame to cut between cameras.</span>
              <span className="ewa-cams-hint-touch">Tap to cut between cameras.</span>
            </>
          }
        />
      </div>
    </section>
  );
}

function Tools() {
  return (
    <section className="chapter chapter--tools" id="level-generator" aria-labelledby="levelgen-title">
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
        <LevelGenSketch pipelineSrc={img("levelgenerator-mapgenpipeline")} />
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
      <ScrollWordmark id="dreamatron-title" name="Dreamatron" />
      <p className="statement dreamatron-intro" data-reveal>
        <Brand /> is the studio I founded. Alongside our games, I’m
        designing and building creative applications for film, sound and
        games, and the interfaces that hold them together.
      </p>
    </section>
  );
}

/** After the studio's games: its tools, starting with the AI Timeline. */
function DreamatronTools() {
  return (
    <section
      className="chapter chapter--dreamatron chapter--dreamatron-tools field-accent"
      id="ai-timeline"
      aria-labelledby="ai-timeline-title"
    >
      <TimelineMini />
      <div className="dreamatron-private">
        <div className="dreamatron-door" data-reveal>
          <a className="button button--ink" href="/studio/">
            Open the client preview
          </a>
          <p>Password protected. Ask me for access.</p>
        </div>
      </div>
    </section>
  );
}

function Paintings() {
  return (
    <section className="chapter chapter--paint" id="paintings" aria-labelledby="paint-title">
      <header className="paint-head">
        <h2 id="paint-title" className="chapter-title" data-reveal>
          Paintings
        </h2>
        <p className="statement" data-reveal>
          Characters, rooms and imagined places.
        </p>
      </header>
      <PaintingRows pieces={paintings} />
    </section>
  );
}

function About() {
  return (
    <section className="chapter chapter--about" id="about" aria-labelledby="about-title">
      <div className="about-columns">
        <div className="about-text">
          <h2 id="about-title" className="chapter-title" data-reveal>
            Teams of 350 and teams of one
          </h2>
          <p data-reveal>
            I graduated with a Bachelor of Science in computer science, focused
            on game programming. Before that I studied illustration and fine art
            at the Academy of Art University in San Francisco. I’m happiest
            where the two overlap: the screens, systems and tools players and
            makers actually touch.
          </p>
          <p data-reveal>
            These days I’m deep in AI. I spend my time testing what models can
            really do, and building the engine and tools at <Brand /> that I
            think the next generation of games will be made with.
          </p>
          <p data-reveal>
            I write C++, Lua, Python, C# and TypeScript, and work in Unreal,
            Unity, Houdini, Blender and now our own <Brand name="Dream Engine" />.
          </p>
          <a className="button about-contact" href={contact.href} target="_blank" rel="noreferrer" data-reveal>
            {contact.label}
          </a>
        </div>
        <ResumeSummary />
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main id="main" tabIndex={-1} className="home">
      <SectionShaders />
      <Hero />
      <ScrollRail />
      <GodOfWar />
      <Judas />
      <Dreamatron />
      <Ewa />
      <Tanuki />
      <DreamatronTools />
      <Tools />
      <Paintings />
      <About />
    </main>
  );
}
