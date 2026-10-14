import Brand from "../components/Brand";
import {
  CaseBody,
  CaseFigure,
  CaseGallery,
  CaseHero,
  CaseHeroFrame,
  CaseList,
  CaseNotes,
  CaseSection,
  CaseSplit,
  CaseVideo,
  CaseYouTube,
  type CaseImage,
} from "../components/CaseStudy";
import JudasTrailer from "../components/JudasTrailer";
import type { PortfolioProject, ProjectSlug } from "./types";

/*
 * The project focus pages. PortfolioPage sets each page's head (title,
 * details, statement), its hero and the pager; the Article is the body.
 */

const site = (name: string) => `/Resources/Site/img/${name}.webp`;
const loop = (name: string) => `/Resources/Site/loops/${name}`;

const image = (src: string, alt: string, width: number, height: number): CaseImage => ({
  src,
  alt,
  width,
  height,
});

/** DREAMATRON games: the studio, then the engine, as on the home page. */
const dreamatronGame = [
  <Brand />,
  <>
    <span className="meta-lead">Made with</span>
    <Brand name="Dream Engine" />
  </>,
];

const sonyCredit =
  "God of War (2018) © Sony Interactive Entertainment. Shown to illustrate my work on the UI team.";

/* God of War --------------------------------------------------------------- */

function GodOfWarArticle() {
  return (
    <CaseBody>
      <CaseSection
        aside={
          <CaseList
            label="The primary menu"
            items={["Weapons", "Armor", "Huldra Shop", "Skills", "Map", "Goals", "Codex", "Resources"]}
          />
        }
      >
        <p>
          For most of my time at Sony I was on the UI team, building the menus. I also worked on
          development tools, narrative scripting and QA.
        </p>
        <p>
          The UI was built from a combination of Lua and C++ in Sony&rsquo;s proprietary engine. I
          built camera and generalized UI blending systems for animating UI elements, plus state
          machines for menus that controlled character animations and camera positions.
        </p>
        <p>
          The project was a constant race against deadlines to fit in as many extra features as we
          could, and to make the interface as usable and intuitive as possible.
        </p>
      </CaseSection>

      <CaseSection
        title="Inventory"
        media={
          <CaseGallery
            caption={sonyCredit}
            items={[
              image(site("gow-gow-ui-weapons-01"), "God of War weapons menu", 1800, 1012),
              image(site("gow-gow-ui-armor-01"), "God of War armor menu", 1800, 1012),
            ]}
          />
        }
      >
        <p>
          We rearranged the inventory menus many times and eventually split weapons and armor into
          separate tabs for clarity. The design challenge was finding clarity in a large amount of
          information that players needed to understand.
        </p>
        <p>
          Many parts of the UI were built with modular components, which let us reuse widgets and
          combine them in new contexts for menus with similar item structures.
        </p>
      </CaseSection>

      <CaseSection
        title="Skills"
        media={
          <figure className="case-figure">
            <CaseVideo
              ambient
              src={loop("gow-Skills.mp4")}
              poster={image(loop("gow-Skills.webp"), "", 1280, 720)}
              label="God of War skill tree footage"
            />
            <figcaption>{sonyCredit}</figcaption>
          </figure>
        }
      >
        <p>
          Most of the UI uses discrete selection, but I prototyped a free-moving cursor with
          magnetism and snapping in Unity and brought it in to pitch to the technical director. It
          made the skill tree feel much more fluid and intuitive.
        </p>
        <p>
          I also integrated Bink video playback, with help from Bob Soper, so each skill node could
          demonstrate its move and help the player decide.
        </p>
      </CaseSection>

      <CaseSection
        title="Map and Codex"
        media={
          <figure className="case-figure">
            <div className="case-pair">
              <CaseVideo
                ambient
                src={loop("gow-Map.mp4")}
                poster={image(loop("gow-Map.webp"), "", 1280, 720)}
                label="God of War map menu footage"
              />
              <CaseVideo
                ambient
                src={loop("gow-Codex.mp4")}
                poster={image(loop("gow-Codex.webp"), "", 1280, 720)}
                label="God of War codex menu footage"
              />
            </div>
            <figcaption>{sonyCredit}</figcaption>
          </figure>
        }
      >
        <p>
          I was involved in many rounds of user playtesting and feedback. We re-evaluated the full
          flow of the menus several times, until we were confident players could find their way
          without getting lost.
        </p>
      </CaseSection>
    </CaseBody>
  );
}

/* Judas -------------------------------------------------------------------- */

// The statement and the trailer carry this page; there is no further body.
function JudasArticle() {
  return null;
}

/* Level Generator ---------------------------------------------------------- */

function LevelGeneratorArticle() {
  return (
    <CaseBody>
      <CaseSection>
        <p>
          I spent a year, on and off, building a procedural level generator in Unreal Engine 5.
          Procedural content generation has interested me for many years, and this was one of the
          first chances I had to put serious time into the problem.
        </p>
        <p>
          It began as a feature I wanted to test in Project EWA, but I didn&rsquo;t want to burden
          that project if the system didn&rsquo;t work out.
        </p>
      </CaseSection>

      <section className="case-videos">
        <div className="case-pair">
          <figure className="case-figure">
            <CaseYouTube
              id="pY-CAoqUSIQ"
              title="Procedural Level Generator overview video"
              poster={image(site("levelgenerator-1"), "", 1800, 977)}
            />
            <figcaption>Overview</figcaption>
          </figure>
          <figure className="case-figure">
            <CaseYouTube
              id="2dHuQpFC9EQ"
              title="Procedural Level Generator early build footage"
              poster={image(site("levelgenerator-4"), "", 955, 503)}
            />
            <figcaption>Early build footage</figcaption>
          </figure>
        </div>
      </section>

      <CaseSection
        title="Built around gameplay"
        media={
          <CaseGallery
            items={[
              image(site("levelgenerator-2"), "Generated kitchen with peeling tiles", 1800, 1014),
              image(site("levelgenerator-5"), "Generated hallway with a lit doorway", 1800, 1005),
            ]}
          />
        }
      >
        <p>
          It was important that the generator could work with gameplay mechanics instead of living
          only as a technical demo. A simple quest system can generate quests, and the level
          generator makes sure rooms are created to support their objectives.
        </p>
      </CaseSection>

      <CaseSection
        title="Generation process"
        media={
          <>
            <CaseFigure
              image={image(
                site("levelgenerator-mapgenpipeline"),
                "Diagram of the generation process: the level config feeds CreateMapData, whose map data is then built into meshes, rooms and props",
                1800,
                736,
              )}
            />
            <CaseFigure
              size="natural"
              image={image(
                "/Resources/Projects/LevelGenerator/Screenshot_LevelConfig.png",
                "Level generator configuration settings",
                507,
                201,
              )}
              caption="A level config"
            />
          </>
        }
      >
        <p>
          First an abstract map data structure is generated, then the map is instantiated from that
          data. The map data is serializable, so a specific layout can be loaded again later.
        </p>
      </CaseSection>

      <CaseSplit
        title="Themes"
        figure={
          <CaseFigure
            size="natural"
            image={image(
              "/Resources/Projects/LevelGenerator/Screenshot_ThemeConfig.png",
              "Level generator theme configuration settings",
              713,
              809,
            )}
            caption="A theme config"
          />
        }
      >
        <p>
          Themes are modular objects. Every phase of map generation can consult the theme to decide
          which assets to use.
        </p>
      </CaseSplit>

      <CaseSection title="Future goals">
        <ul className="case-list">
          <li>Make level configs easier to use, so different level types are simpler to generate.</li>
          <li>Support more diverse gameplay mechanics.</li>
          <li>Work with a 3D artist to validate different art styles.</li>
          <li>Support exteriors and structures that don&rsquo;t conform to a square grid.</li>
        </ul>
      </CaseSection>
    </CaseBody>
  );
}

/* Tanuki ------------------------------------------------------------------- */

function TanukiArticle() {
  return (
    <CaseBody>
      <CaseSection
        aside={
          <CaseList
            label="Main features"
            items={[
              "NPC AI",
              "Simulation-driven world",
              "General purpose utility-based scoring system",
              "Day and night cycle",
              "Equipment system",
              "Cooking system",
              "Dialogue system",
              "Dynamic quest system",
              "Restaurant building mechanics",
              "Fishing",
              "Farming",
            ]}
          />
        }
      >
        <p>
          Tanuki is a game I have been building for the past few years. A lot of it is done, and
          there is still much to go. I plan to start a public development blog to show more of it.
        </p>
      </CaseSection>

      <CaseGallery
        caption="Concept paintings"
        items={[
          { ...image(site("tanuki-concept-shack"), "Concept painting of a mushroom-roofed shack", 1672, 942), ratio: 16 / 9 },
          { ...image(site("tanuki-concept-hut"), "Concept painting of a hut in the forest", 1694, 928), ratio: 16 / 9 },
        ]}
      />

      <CaseSection
        title="Systems"
        media={
          <CaseNotes
            notes={[
              {
                title: "Recipes ask for qualities, not items.",
                body: "Dishes don’t need specific ingredients; they set criteria that ingredients must satisfy. A recipe can call for a grilled carrot, any grilled vegetable, or a carrot of any quality, which keeps cooking flexible and open to a wide variety of dishes.",
              },
              {
                title: "Everything has a state.",
                body: "The world is meant to feel alive, with a day and night cycle, weather and seasons. Any actor can carry a modifier component that defines how its simulation state updates.",
              },
              {
                title: "NPCs weigh their choices.",
                body: "A generic utility scoring system makes weighted random decisions. The AI leans on it to decide how NPCs behave, and because it doesn’t depend on specific game mechanics, it carries across projects.",
              },
              {
                title: "A diverse cast.",
                body: "NPCs visit the player’s restaurant, each with their own behaviours and personality, which shape how they deal with the player and the world.",
              },
              {
                title: "Quests, generated or bespoke.",
                body: "The quest system can generate quests dynamically as well as support bespoke ones.",
              },
              {
                title: "Build the restaurant.",
                body: "The player constructs and upgrades their restaurant, and many structures need resources before they can be built.",
              },
            ]}
          />
        }
      />
    </CaseBody>
  );
}

/* EWA ---------------------------------------------------------------------- */

function EwaArticle() {
  return (
    <CaseBody>
      <CaseSplit
        figure={
          <CaseFigure
            image={image(site("ewa-ewa-redacted"), "Red key art of a figure with redacted eyes", 1800, 2044)}
          />
        }
      >
        <p>A third-person adventure horror game, in development.</p>
        <CaseList
          label="Main features"
          items={[
            "Narrative emphasis",
            "Exploration and puzzle solving",
            "Dialogue system",
            "Combat system",
            "Grid inventory system",
            "Static camera system",
          ]}
        />
      </CaseSplit>

      <CaseFigure
        image={image(site("ewa-ewa-concept-01"), "Concept painting of a burning furnace room", 1800, 766)}
        caption="Concept painting, the furnace room"
      />

      <CaseGallery
        caption="Early development screenshots, in engine"
        items={[
          { ...image(site("ewa-1"), "A dim, lamp-lit room, the player by the door", 1800, 1012), ratio: 2.3 },
          { ...image(site("ewa-3"), "Looking down a narrow wooden corridor", 1800, 1012), ratio: 2.3 },
          { ...image(site("ewa-4"), "A desk lamp in a dark hall", 1800, 1012), span: 4, spanSmall: 6, ratio: 2.3 },
          { ...image(site("ewa-5"), "A dark hall below a broken balcony", 1800, 1012), span: 4, spanSmall: 6, ratio: 2.3 },
          { ...image(site("ewa-2"), "A television glowing with static in the dark", 1800, 1012), span: 4, ratio: 2.3 },
        ]}
      />
    </CaseBody>
  );
}

/* AI Model Timeline -------------------------------------------------------- */

function AiTimelineArticle() {
  return (
    <CaseBody>
      <CaseSection>
        <p>
          A shareable web app for comparing major AI foundation model releases and coding harnesses
          across providers on a single chronological timeline.
        </p>
        <div className="case-links">
          <a className="button" href="https://www.dreamatron.ai/timeline" target="_blank" rel="noreferrer">
            Open the current version
          </a>
          <a
            className="text-link"
            href="https://kvick-games.github.io/AI_Model_Timeline_Website/"
            target="_blank"
            rel="noreferrer"
          >
            First version
          </a>
          <a
            className="text-link"
            href="https://github.com/kvick-games/AI_Model_Timeline_Website"
            target="_blank"
            rel="noreferrer"
          >
            Source on GitHub
          </a>
        </div>
      </CaseSection>

      <CaseSplit
        title="The current version"
        figure={
          <CaseFigure
            image={image(
              site("dreamatron-timeline-detail"),
              "Detail of the current AI Timeline: release markers and gap labels along company lines",
              900,
              650,
            )}
          />
        }
      >
        <p>
          The timeline now lives at dreamatron.ai. It maps AI history, LLMs, generative media,
          audio, voice models, world models, coding tools, events, robotics and vehicle autonomy.
        </p>
        <p>
          The board pans like a canvas, with a zoom rail, company and category filters, an optional
          token-pricing overlay, and gap labels that compare each release with its line&rsquo;s
          average.
        </p>
      </CaseSplit>

      <CaseSection
        title="The first version"
        aside={
          <CaseList label="Tech stack" items={["React 19", "Vite", "TypeScript", "Tailwind CSS", "Motion"]} />
        }
        media={
          <CaseFigure
            image={image(site("misc-ai-model-timeline"), "First version of the AI Model Timeline", 1343, 694)}
          />
        }
      >
        <p>
          The timeline lays out model launches horizontally, so release cadence can be compared
          across companies and product lines at a glance.
        </p>
        <p>
          It includes company rows, compact product-line lanes, filtering by model category, month
          and year guides, zoom controls, release-gap labels, and a live Today marker.
        </p>
        <ul className="case-list">
          <li>Frontier and open-source LLM release tracking</li>
          <li>Coding harness, image generation, video generation and 3D generation categories</li>
          <li>Interactive filters for reading dense sections of the timeline</li>
          <li>GitHub Pages deployment through a Vite build pipeline</li>
        </ul>
      </CaseSection>
    </CaseBody>
  );
}

/* Projects ----------------------------------------------------------------- */

export const portfolioProjects: PortfolioProject[] = [
  // The home page order.
  {
    slug: "god-of-war",
    title: "God of War (2018)",
    cardTitle: "God of War",
    subtitle: "UI systems / AAA production",
    category: "games",
    featured: true,
    cardImage: "/Resources/Projects/GoW2018Cover.webp",
    backgroundImage: site("gow-banner-clean"),
    details: ["Sony Santa Monica Studio", "Associate Technical UI Designer, 2016–2018"],
    statement:
      "On a team of more than 350, I was largely responsible for the technical design and implementation of the primary game menu.",
    hero: (
      <CaseHero
        bleed
        image={image(
          site("gow-banner-clean"),
          "God of War (2018) key art: Kratos and Atreus fighting a troll in a burning forest",
          2000,
          1125,
        )}
        caption={sonyCredit}
      />
    ),
    Article: GodOfWarArticle,
  },
  {
    slug: "judas",
    title: "Judas",
    cardTitle: "Judas",
    subtitle: "UI scripting / gameplay systems",
    category: "games",
    cardImage: "/Resources/Projects/judas-img.jpg",
    backgroundImage: site("projects-judas-img2"),
    details: ["Ghost Story Games", "User Interface Design Scripter, 2018–2020"],
    statement:
      "An unreleased first-person immersive sim. I worked on its user interface and gameplay systems, building the UI in Unreal Engine 4 with UMG and C++.",
    hero: (
      <CaseHeroFrame
        caption={
          <>
            The reveal trailer. The official upload is age-restricted, so this plays IGN&rsquo;s copy.{" "}
            <a href="https://www.youtube.com/watch?v=FoLJ4HgWqw4" target="_blank" rel="noreferrer">
              Watch the official upload on YouTube
            </a>
          </>
        }
      >
        <JudasTrailer poster={site("projects-judas-img2")} alt="Still from the Judas reveal trailer" />
      </CaseHeroFrame>
    ),
    Article: JudasArticle,
  },
  {
    slug: "ewa",
    title: "EWA",
    cardTitle: "EWA",
    subtitle: "Adventure horror",
    category: "games",
    cardImage: site("ewa-ewa-redacted"),
    backgroundImage: site("ewa-ewa-concept-01"),
    details: dreamatronGame,
    statement:
      "Deep in a frozen winter, people have started to vanish. Survive what waits in the dark and uncover the truth.",
    hero: (
      <CaseHeroFrame caption="Teaser">
        <CaseVideo
          src="/Resources/Projects/EWA/TEASER_02_01.mp4"
          poster={image(site("ewa-teaser-poster"), "", 1600, 900)}
          label="Project EWA teaser"
        />
      </CaseHeroFrame>
    ),
    Article: EwaArticle,
  },
  {
    slug: "tanuki",
    title: "Tanuki",
    cardTitle: "Tanuki",
    subtitle: "Simulation-driven world",
    category: "games",
    cardImage: site("tanuki-concept-island"),
    backgroundImage: site("tanuki-concept-island"),
    details: dreamatronGame,
    statement:
      "Become a master chef. Explore an island full of possibilities, make friends with the locals and cook them something unforgettable.",
    hero: (
      <CaseHero
        bleed
        image={image(
          loop("tanuki-island.webp"),
          "Concept painting of the island from the air, a village on its shore",
          1600,
          900,
        )}
        loop={loop("tanuki-island.mp4")}
        caption="Concept painting"
      />
    ),
    Article: TanukiArticle,
  },
  {
    slug: "ai-model-timeline",
    title: "AI Model Timeline",
    cardTitle: "AI Model Timeline",
    subtitle: "React timeline web app",
    category: "web-tools",
    cardImage: site("dreamatron-timeline"),
    backgroundImage: site("dreamatron-timeline"),
    details: ["Solo web app, 2026", "React, TypeScript, Vite"],
    statement:
      "A web app that lines up AI model releases across providers on one chronological timeline.",
    hero: (
      <CaseHero
        image={image(
          site("dreamatron-timeline"),
          "The current AI Timeline: company lines of model releases across a pannable board",
          1800,
          1125,
        )}
        caption="The current version, live at dreamatron.ai"
      />
    ),
    Article: AiTimelineArticle,
  },
  {
    slug: "level-generator",
    title: "Level Generator",
    cardTitle: "Level Generator",
    subtitle: "Unreal Engine tool pipeline",
    category: "games",
    cardImage: "/Resources/Projects/levelGen_img.png",
    backgroundImage: site("levelgenerator-3"),
    details: ["Solo technical demo", "2023, Unreal Engine 5"],
    statement:
      "A procedural level generator for Unreal Engine 5, designed to work with gameplay rather than beside it.",
    hero: (
      <CaseHero
        bleed
        image={image(site("levelgenerator-3"), "Exterior of a generated structure", 1800, 782)}
      />
    ),
    Article: LevelGeneratorArticle,
  },
];

export const projectsBySlug = new Map<ProjectSlug, PortfolioProject>(
  portfolioProjects.map((project) => [project.slug, project]),
);

export function getPortfolioProject(slug: string | null) {
  if (!slug) return null;
  return projectsBySlug.get(slug as ProjectSlug) ?? null;
}
