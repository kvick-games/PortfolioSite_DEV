/** The résumé, shared by the About page sheet and the home page summary. */

export const resumePdf = "/Resources/Michael_Nevins_Resume_TechnicalDesigner.pdf";

export const experience = [
  {
    role: "Founder / Developer",
    company: "DREAMATRON",
    years: "2020 - Current",
    bullets: [
      "Building Dream Engine and AI tools for making games, and Project Tanuki, a simulation-driven game built on them.",
      "Implemented NPC AI, utility scoring, dynamic quests, dialogue, equipment, cooking, building, farming, and fishing systems.",
      "Own broad design and engineering tasks across gameplay, tools, UI, content workflows, and production planning.",
    ],
  },
  {
    role: "User Interface Design Scripter",
    company: "Ghost Story Games",
    years: "2018 - 2020",
    bullets: [
      "Worked on Judas, an unreleased first-person immersive sim built in Unreal Engine.",
      "Implemented user interface and gameplay systems using UMG, Unreal Engine 4, and C++.",
      "Collaborated across design and engineering to support fast iteration on player-facing systems.",
    ],
  },
  {
    role: "Associate Technical UI Designer",
    company: "Sony Santa Monica Studio",
    years: "2016 - 2018",
    bullets: [
      "Worked on God of War (2018), focusing on the primary game menu and related UI systems.",
      "Built menu logic, camera blending, UI animation systems, and state machines in Lua and C++.",
      "Supported development tools, narrative scripting, QA, and repeated usability passes from playtest feedback.",
    ],
  },
];

export const selectedProjects = [
  {
    title: "Procedural Level Generator",
    meta: "Solo technical demo / Unreal Engine 5 / 2023",
    description:
      "Built a procedural level generation pipeline for configurable rooms, themes, serialized map data, and gameplay-aware quest support.",
  },
  {
    title: "Project EWA",
    meta: "Solo game project / Dream Engine",
    description:
      "Developing a third-person adventure horror game with exploration, puzzle solving, combat, grid inventory, dialogue, and static camera systems.",
  },
  {
    title: "AI Model Timeline",
    meta: "React / TypeScript / Vite",
    description:
      "Created a public web app for comparing major AI model and coding-tool releases across companies on a single chronological timeline.",
  },
];

export const skillGroups = [
  {
    title: "Skills",
    items: [
      "Gameplay Systems",
      "Optimization",
      "User Interface",
      "Technical Art",
      "C++",
      "Unreal Blueprints / UMG",
      "Python",
      "C#",
      "Lua",
    ],
  },
  {
    title: "Software",
    items: [
      "Visual Studio",
      "Unreal",
      "Blender",
      "Houdini",
      "Photoshop",
      "Ableton",
      "Unity",
      "Maya",
      "ZBrush",
      "Substance",
    ],
  },
];

export const contactLinks = [
  { label: "www.kvick-games.com", href: "https://www.kvick-games.com/" },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/michael-nevins-690b3140/",
  },
  { label: "ArtStation", href: "https://www.artstation.com/kvick" },
  { label: "X / kvickart", href: "https://x.com/kvickart" },
];

export const educationItems = [
  {
    title: "Computer Science, Game Programming (BS 2024)",
    details: ["Academy of Art", "University San Francisco"],
  },
  {
    title: "Fine Art, Illustration, 3D Modeling and Animation",
    details: ["Academy of Art", "University San Francisco"],
  },
  {
    title: "AI & Machine Learning Bootcamp (2023)",
    details: ["Caltech CTME"],
  },
];

export const interests = ["AI / PCG / Math", "Art + Music Production", "Martial Arts"];
