import {
  ArticleSection,
  ArticleShell,
  ExternalVideoLink,
  FeatureList,
  LinkButtons,
  MediaImage,
  SplitFeature,
  VideoFrame,
  YouTubeEmbed,
} from "../components/ArticlePrimitives";
import type { PortfolioProject, ProjectSlug } from "./types";

function GodOfWarArticle() {
  return (
    <ArticleShell
      title="God of War (2018)"
      details={[
        "Sony Santa Monica Studio",
        "Associate Technical UI Designer",
        "2016 - 2018",
        "Proprietary Engine",
      ]}
    >
      <p>
        I worked on the UI team to create the menus for the majority of my time at Sony.
        I also worked on development tools, narrative scripting, and QA. I was largely
        responsible for technical design and implementation of the primary game menu.
      </p>
      <FeatureList
        items={[
          "Weapons",
          "Armor",
          "Huldra Shop",
          "Skills",
          "Map",
          "Goals",
          "Codex",
          "Resources",
        ]}
      />
      <p>
        The UI was built from a combination of Lua and C++ in Sony's proprietary engine. I
        built camera and generalized UI blending systems for animating UI elements, plus
        state machines for menus that controlled character animations and camera positions.
      </p>
      <p>
        The project was a constant battle against time and deadlines to squeeze in as many
        extra features as possible and make the interface as usable and intuitive as we could.
      </p>

      <ArticleSection title="Inventory Menus">
        <p>
          We re-arranged the inventory menus many times and eventually split weapons and armor
          into separate tabs for clarity. The design challenge was finding clarity in a large
          amount of information that players needed to understand.
        </p>
        <p>
          Many parts of the UI were built with modular components, which allowed us to reuse
          widgets and combine them into new contexts for menus with similar item structures.
        </p>
        <div className="media-grid">
          <MediaImage src="/Resources/Projects/GoW/GoW_UI_Armor_01.jpg" alt="God of War armor menu" />
          <MediaImage
            src="/Resources/Projects/GoW/GoW_UI_Weapons_01.jpg"
            alt="God of War weapons menu"
          />
        </div>
      </ArticleSection>

      <ArticleSection title="Skills Menu">
        <p>
          Most of the UI is implemented with discrete selection, but I prototyped a free-moving
          cursor with magnetism and snapping in Unity and brought it in to pitch to the technical
          director. It made the skill tree feel much more fluid and intuitive.
        </p>
        <p>
          I also integrated Bink video playback with assistance from Bob Soper so each skill node
          could demonstrate moves and help the player make decisions.
        </p>
        <VideoFrame
          src="/Resources/Projects/GoW/God-of-War-UI_Menu_Skills.mp4"
          title="God of War skills menu video"
        />
      </ArticleSection>

      <ArticleSection title="Map Menu">
        <VideoFrame
          src="/Resources/Projects/GoW/God-of-War-UI_Menu_Map.mp4"
          title="God of War map menu video"
        />
      </ArticleSection>

      <ArticleSection title="Codex Menu">
        <VideoFrame
          src="/Resources/Projects/GoW/God-of-War-UI_Menu_Codex.mp4"
          title="God of War codex menu video"
        />
        <p>
          I was involved with many rounds of user playtesting and feedback. We re-evaluated the
          full flow of the menus multiple times until we were confident the player could navigate
          without getting lost.
        </p>
      </ArticleSection>
    </ArticleShell>
  );
}

function JudasArticle() {
  return (
    <ArticleShell
      title="Judas"
      details={[
        "Unreleased",
        "Ghost Story Games",
        "User Interface Design Scripter",
        "2018 - 2020",
        "Unreal Engine",
      ]}
    >
      <p>
        Judas is an unreleased first-person immersive sim. I worked on user interface and
        gameplay systems, with the UI built in Unreal Engine 4 using UMG and C++.
      </p>
      <ExternalVideoLink
        title="Judas reveal trailer"
        href="https://www.youtube.com/watch?v=FoLJ4HgWqw4"
        image="/Resources/Projects/judas-img.jpg"
        description="The trailer is age-restricted on YouTube, so it opens directly on YouTube instead of embedding a blocked player."
      />
    </ArticleShell>
  );
}

function LevelGeneratorArticle() {
  return (
    <ArticleShell

      title="Level Generator"
      details={["Solo", "Technical Demo", "2023", "Unreal Engine 5"]}
    >
      <ArticleSection title="Overview Video">
        <YouTubeEmbed
          title="Procedural Level Generator overview video"
          src="https://www.youtube.com/embed/pY-CAoqUSIQ?si=iw924YIA_5pT9qlD"
        />
      </ArticleSection>
      <p>
        I spent a year on and off building a procedural level generator in Unreal Engine 5. I
        have had a strong interest in procedural content generation for many years, but this was
        one of the first opportunities where I could invest significant time into the problem.
      </p>
      <p>
        This began as a feature I wanted to test in Project EWA, but I did not want to burden
        that project if the system did not work out.
      </p>
      <ArticleSection title="Future Goals">
        <FeatureList
          items={[
            "Improve the usability of level configs so generating different level types is easier.",
            "Add support for more diverse gameplay mechanics.",
            "Work with a 3D artist to validate different art styles.",
            "Support exteriors and structures that do not conform to a square grid.",
          ]}
        />
      </ArticleSection>
      <div className="media-grid">
        <MediaImage src="/Resources/Projects/LevelGenerator/2.png" alt="Generated level room layout" />
        <MediaImage src="/Resources/Projects/LevelGenerator/5.png" alt="Generated level kitchen theme" />
      </div>
      <ArticleSection>
        <p>
          It was important to design the generator so it could integrate with gameplay mechanics
          instead of living only as a technical demo. A simple quest system can generate quests,
          and the level generator can ensure rooms are created to support quest objectives.
        </p>
      </ArticleSection>
      <div className="media-grid">
        <MediaImage src="/Resources/Projects/LevelGenerator/3.png" alt="Generated level exterior" />
        <MediaImage src="/Resources/Projects/LevelGenerator/4.png" alt="Generated structure exterior" />
      </div>
      <ArticleSection title="Generation Process">
        <MediaImage
          src="/Resources/Projects/LevelGenerator/MapGenPipeline.png"
          alt="Procedural generation process diagram"
        />
        <p>
          First, an abstract map data structure is generated, then the map is instantiated from
          that data. The map data is serializable and can be reused if a specific layout needs
          to be loaded again later.
        </p>
        <MediaImage
          src="/Resources/Projects/LevelGenerator/Screenshot_LevelConfig.png"
          alt="Level generator configuration screen"
          size="medium"
        />
      </ArticleSection>
      <ArticleSection title="Themes">
        <p>
          Themes are modular objects. Every phase of map generation can reference the theme to
          determine which assets to use.
        </p>
        <MediaImage
          src="/Resources/Projects/LevelGenerator/Screenshot_ThemeConfig.png"
          alt="Level generator theme configuration screen"
          size="medium"
        />
      </ArticleSection>
      <ArticleSection title="Early Build Footage">
        <YouTubeEmbed
          title="Procedural Level Generator early build footage"
          src="https://www.youtube.com/embed/2dHuQpFC9EQ?si=X7g4EZBZ2gaOabQO"
        />
      </ArticleSection>
    </ArticleShell>
  );
}

function TanukiArticle() {
  return (
    <ArticleShell
      title="Project Tanuki (Unreleased)"
      details={["DREAMATRON", "Founder", "2020 - Current", "Dream Engine"]}
    >
      <p>
        This is a game I have been working on for the past few years. There is a lot of work
        done on the game, but still much left to go. I plan on creating a public development
        blog to show pieces of the game in the future.
      </p>
      <ArticleSection title="Main Features">
        <FeatureList
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
      </ArticleSection>
      <ArticleSection title="Cooking System">
        <p>
          I designed the cooking system to be more flexible than a typical crafting system.
          Dishes do not necessarily require specific ingredients, but can instead use criteria
          that ingredients must satisfy.
        </p>
        <p>
          Criteria can require a grilled carrot, a grilled vegetable, or a carrot of any
          quality. This keeps the design flexible and supports a wide variety of crafting
          possibilities.
        </p>
        <MediaImage
          src="/Resources/Projects/Tanuki/Screenshot_Cooking_01.png"
          alt="Tanuki cooking interface"
        />
      </ArticleSection>
      <ArticleSection>
        <SplitFeature
          image="/Resources/Projects/Tanuki/QuestComplete.png"
          imageAlt="Tanuki quest completion interface"
          imageFirst
        >
          <h2>Quest System</h2>
          <p>The quest system can generate quests dynamically as well as support bespoke quests.</p>
        </SplitFeature>
      </ArticleSection>
      <ArticleSection>
        <SplitFeature image="/Resources/Projects/Tanuki/Simulation_01.png" imageAlt="Tanuki simulation data">
          <h2>Simulation-Driven World</h2>
          <p>
            The game is meant to feel alive and dynamic. There is a day and night cycle, weather,
            and seasons. Any actor can contain a modifier component that defines how its
            simulation state updates.
          </p>
          <p>
            The screenshot shows active simulation components and accompanying influences for an
            apple on a tree.
          </p>
        </SplitFeature>
      </ArticleSection>
      <ArticleSection title="Utility Scoring System">
        <p>
          The utility scoring system is a generic system for weighted random decisions. It is
          heavily used in the AI system to determine how NPCs behave, and it can be ported
          across projects because it does not rely on specific game mechanics.
        </p>
      </ArticleSection>
      <ArticleSection>
        <SplitFeature image="/Resources/Projects/Tanuki/NPC_Dialogue_01.png" imageAlt="Tanuki NPC dialogue">
          <h2>NPCs</h2>
          <p>
            The game contains a diverse cast of NPCs that visit the player's restaurant. NPCs
            have unique behaviors and personalities that affect how they interact with the
            player and the world.
          </p>
        </SplitFeature>
      </ArticleSection>
      <ArticleSection>
        <SplitFeature
          image="/Resources/Projects/Tanuki/Building_01.png"
          imageAlt="Tanuki building mechanics"
          imageFirst
        >
          <h2>Building Mechanics</h2>
          <p>
            The game features a building system where the player can construct and upgrade their
            restaurant. Many structures require resources before they can be built.
          </p>
        </SplitFeature>
      </ArticleSection>
    </ArticleShell>
  );
}

function EwaArticle() {
  return (
    <ArticleShell title="Project EWA (Unreleased)" details={["Solo", "2020 - Current", "Dream Engine"]}>
      <p>Third-person adventure horror game in development.</p>
      <VideoFrame src="/Resources/Projects/EWA/TEASER_02_01.mp4" title="Project EWA teaser video" />
      <ArticleSection title="Main Features">
        <FeatureList
          items={[
            "Narrative emphasis",
            "Exploration and puzzle solving",
            "Dialogue system",
            "Combat system",
            "Grid inventory system",
            "Static camera system",
          ]}
        />
      </ArticleSection>
      <ArticleSection title="Early Development Screenshots">
        <div className="media-grid">
          <MediaImage src="/Resources/Projects/EWA/1.png" alt="Project EWA early screenshot 1" />
          <MediaImage src="/Resources/Projects/EWA/2.png" alt="Project EWA early screenshot 2" />
          <MediaImage src="/Resources/Projects/EWA/3.png" alt="Project EWA early screenshot 3" />
          <MediaImage src="/Resources/Projects/EWA/4.png" alt="Project EWA early screenshot 4" />
          <MediaImage src="/Resources/Projects/EWA/5.png" alt="Project EWA early screenshot 5" />
        </div>
      </ArticleSection>
    </ArticleShell>
  );
}

function AiTimelineArticle() {
  return (
    <ArticleShell
      title="AI Model Timeline"
      details={["Solo", "Web App", "2026", "React, TypeScript, Vite"]}
    >
      <p>
        A shareable web app for comparing major AI foundation model releases and coding
        harnesses across providers on a single chronological timeline.
      </p>
      <LinkButtons
        links={[
          {
            href: "https://www.dreamatron.ai/timeline",
            label: "Open the current version",
          },
          {
            href: "https://kvick-games.github.io/AI_Model_Timeline_Website/",
            label: "First version",
          },
          {
            href: "https://github.com/kvick-games/AI_Model_Timeline_Website",
            label: "GitHub Repo",
          },
        ]}
      />
      <ArticleSection title="The current version">
        <p>
          The timeline now lives at dreamatron.ai. It maps AI history, LLMs, generative
          media, audio, voice models, world models, coding tools, events, robotics and
          vehicle autonomy. The board pans like a canvas, with a zoom rail, company and
          category filters, an optional token-pricing overlay, and gap labels that compare
          each release with its line&rsquo;s average.
        </p>
        <MediaImage
          src="/Resources/Site/img/dreamatron-timeline-detail.webp"
          alt="Detail of the current AI Timeline: release markers and gap labels along company lines"
        />
      </ArticleSection>
      <ArticleSection title="The first version">
        <MediaImage src="/Resources/Projects/Misc/ai-model-timeline.png" alt="First version of the AI Model Timeline" />
      </ArticleSection>
      <ArticleSection title="Overview">
        <p>
          The timeline lays out model launches horizontally so release cadence can be compared
          across companies and product lines at a glance.
        </p>
        <p>
          It includes company rows, compact product-line lanes, filtering by model category,
          month and year guides, zoom controls, release-gap labels, and a live Today marker.
        </p>
      </ArticleSection>
      <ArticleSection title="Project Scope">
        <FeatureList
          items={[
            "Frontier and open-source LLM release tracking",
            "Coding harness, image generation, video generation, and 3D generation categories",
            "Interactive filters for reading dense timeline sections",
            "GitHub Pages deployment through a Vite build pipeline",
          ]}
        />
      </ArticleSection>
      <ArticleSection title="Tech Stack">
        <FeatureList items={["React 19", "Vite", "TypeScript", "Tailwind CSS", "Motion"]} />
      </ArticleSection>
    </ArticleShell>
  );
}

export const portfolioProjects: PortfolioProject[] = [
  {
    slug: "god-of-war",
    title: "God of War (2018)",
    cardTitle: "God of War",
    subtitle: "UI systems / AAA production",
    category: "games",
    featured: true,
    cardImage: "/Resources/Projects/GoW2018Cover.webp",
    backgroundImage: "/Resources/Site/img/gow-banner.webp",
    details: ["Sony Santa Monica Studio", "Associate Technical UI Designer", "2016 - 2018"],
    Article: GodOfWarArticle,
  },
  {
    slug: "judas",
    title: "Judas",
    cardTitle: "Judas",
    subtitle: "UI scripting / gameplay systems",
    category: "games",
    cardImage: "/Resources/Projects/judas-img.jpg",
    backgroundImage: "/Resources/Site/img/projects-judas-img2.webp",
    details: ["Ghost Story Games", "User Interface Design Scripter", "2018 - 2020"],
    Article: JudasArticle,
  },
  {
    slug: "level-generator",
    title: "Procedural Level Generator",
    cardTitle: "Procedural Level Generator",
    subtitle: "Unreal Engine tool pipeline",
    category: "games",
    cardImage: "/Resources/Projects/levelGen_img.png",
    backgroundImage: "/Resources/Site/img/levelgenerator-1.webp",
    details: ["Solo", "Technical Demo", "2023"],
    Article: LevelGeneratorArticle,
  },
  {
    slug: "tanuki",
    title: "Tanuki",
    cardTitle: "Tanuki",
    subtitle: "Simulation-driven world",
    category: "games",
    cardImage: "/Resources/Projects/Tanuki/MistyMorning.png",
    backgroundImage: "/Resources/Site/img/tanuki-2.webp",
    details: ["DREAMATRON", "Founder", "2020 - Current"],
    Article: TanukiArticle,
  },
  {
    slug: "ewa",
    title: "EWA",
    cardTitle: "EWA",
    subtitle: "Solo adventure horror project",
    category: "games",
    cardImage: "/Resources/Projects/EWA/EWA_Redacted.png",
    backgroundImage: "/Resources/Site/img/ewa-ewa-concept-01.webp",
    details: ["Solo", "2020 - Current", "Dream Engine"],
    Article: EwaArticle,
  },
  {
    slug: "ai-model-timeline",
    title: "AI Model Timeline",
    cardTitle: "AI Model Timeline",
    subtitle: "React timeline web app",
    category: "web-tools",
    cardImage: "/Resources/Site/img/dreamatron-timeline.webp",
    backgroundImage: "/Resources/Site/img/dreamatron-timeline.webp",
    details: ["Solo", "Web App", "2026"],
    Article: AiTimelineArticle,
  },
];

export const projectsBySlug = new Map<ProjectSlug, PortfolioProject>(
  portfolioProjects.map((project) => [project.slug, project]),
);

export function getPortfolioProject(slug: string | null) {
  if (!slug) return null;
  return projectsBySlug.get(slug as ProjectSlug) ?? null;
}
