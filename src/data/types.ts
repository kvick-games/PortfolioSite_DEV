import type { ComponentType, ReactNode } from "react";

export type ProjectSlug =
  | "god-of-war"
  | "judas"
  | "level-generator"
  | "tanuki"
  | "ewa"
  | "ai-model-timeline";

export type ProjectCategory = "games" | "web-tools";

export interface PortfolioProject {
  slug: ProjectSlug;
  title: string;
  cardTitle: string;
  subtitle: string;
  category: ProjectCategory;
  featured?: boolean;
  cardImage: string;
  backgroundImage: string;
  /** Meta lines under the title (studio, role, years); may hold <Brand />. */
  details: ReactNode[];
  /** One or two sentences set beside the title. */
  statement: ReactNode;
  /** The page's key media, full width under the head. */
  hero: ReactNode;
  Article: ComponentType;
}

export interface MiscProject {
  slug: string;
  title: string;
  subtitle: string;
  image?: string;
  details: string[];
  Article: ComponentType;
}

export interface ArtPiece {
  slug: string;
  title: string;
  description?: string;
  sourceUrl: string;
  coverImage: string;
  images: string[];
  embedUrl?: string;
  /** A short muted loop shown over the cover (which doubles as its poster). */
  loop?: string;
}
