import {
  ArticleSection,
  ArticleShell,
  FeatureList,
  LinkButtons,
  MediaImage,
} from "../components/ArticlePrimitives";
import type { MiscProject } from "./types";

function MusicVisualizerArticle() {
  return (
    <ArticleShell title="Music Visualizer" details={["Web Audio API", "Canvas", "JavaScript"]}>
      <p>An interactive music visualizer created with Web Audio API and Canvas.</p>
      <MediaImage src="/Resources/Projects/Misc/musicvis.jpg" alt="Music visualizer preview" />
      <ArticleSection title="Features">
        <FeatureList
          items={[
            "Real-time frequency analysis",
            "Multiple visualization modes",
            "Responsive layout across devices",
            "Customizable color schemes",
          ]}
        />
      </ArticleSection>
      <ArticleSection title="Technologies Used">
        <FeatureList items={["JavaScript", "Web Audio API", "HTML5 Canvas", "CSS3"]} />
      </ArticleSection>
    </ArticleShell>
  );
}

function GenerativeArtArticle() {
  return (
    <ArticleShell title="Generative Art Experiments" details={["Procedural Art", "p5.js", "WebGL"]}>
      <p>
        A collection of generative art experiments created while exploring algorithmic art
        generation techniques.
      </p>
      <MediaImage src="/Resources/Projects/Misc/generativeart.jpg" alt="Generative art preview" />
      <ArticleSection title="Techniques Explored">
        <FeatureList
          items={[
            "Lindenmayer systems",
            "Cellular automata",
            "Flow fields",
            "Voronoi diagrams",
            "Recursive patterns",
          ]}
        />
      </ArticleSection>
      <ArticleSection title="Tools Used">
        <FeatureList items={["p5.js", "Three.js", "Custom WebGL shaders"]} />
      </ArticleSection>
    </ArticleShell>
  );
}

function AiTimelineMiscArticle() {
  return (
    <ArticleShell title="AI Model Timeline" details={["React 19", "Vite", "TypeScript", "Motion"]}>
      <p>
        An interactive timeline website for comparing major AI model and coding-tool releases
        across providers.
      </p>
      <LinkButtons
        links={[
          {
            href: "https://kvick-games.github.io/AI_Model_Timeline_Website/",
            label: "View Live Site",
          },
          {
            href: "https://github.com/kvick-games/AI_Model_Timeline_Website",
            label: "GitHub Repo",
          },
        ]}
      />
      <MediaImage src="/Resources/Projects/Misc/ai-model-timeline.png" alt="AI Model Timeline screenshot" />
      <ArticleSection title="Highlights">
        <FeatureList
          items={[
            "Company rows with compact product-line lanes",
            "Filters for frontier LLMs, open-source LLMs, coding harnesses, image generation, video generation, and 3D generation",
            "Month and year guides, zoom controls, release-gap labels, and a live Today marker",
          ]}
        />
      </ArticleSection>
    </ArticleShell>
  );
}

export const miscProjects: MiscProject[] = [
  {
    slug: "music-visualizer",
    title: "Music Visualizer",
    subtitle: "Audio-reactive canvas study",
    image: "/Resources/Projects/Misc/musicvis.jpg",
    details: ["Web Audio API", "Canvas"],
    Article: MusicVisualizerArticle,
  },
  {
    slug: "generative-art",
    title: "Generative Art Experiments",
    subtitle: "Procedural sketch collection",
    image: "/Resources/Projects/Misc/generativeart.jpg",
    details: ["p5.js", "WebGL"],
    Article: GenerativeArtArticle,
  },
  {
    slug: "ai-model-timeline",
    title: "AI Model Timeline",
    subtitle: "Foundation model release map",
    image: "/Resources/Projects/Misc/ai-model-timeline.png",
    details: ["React", "TypeScript", "Vite"],
    Article: AiTimelineMiscArticle,
  },
];

export function getMiscProject(slug: string | null) {
  if (!slug) return null;
  return miscProjects.find((project) => project.slug === slug) ?? null;
}
