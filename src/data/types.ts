import type { ComponentType } from "react";

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
  details: string[];
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
}
