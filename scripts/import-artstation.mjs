import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const defaultSourceUrl = "https://kvick.artstation.com/projects";
const outputRoot = path.join(root, "Resources", "ArtStation");
const dataOutputPath = path.join(root, "src", "data", "artPieces.ts");

const args = new Map();

for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];

  if (arg.startsWith("--")) {
    args.set(arg, process.argv[index + 1]);
    index += 1;
  }
}

const manifestPath = args.get("--manifest");
const sourceUrl = args.get("--source") ?? defaultSourceUrl;

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function toAbsoluteUrl(value, baseUrl) {
  return new URL(decodeHtml(value), baseUrl).toString();
}

function slugify(value, fallback) {
  const slug = value
    .toLowerCase()
    .replaceAll(",", "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

function safeFileName(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueBy(items, keyForItem) {
  const seen = new Set();

  return items.filter((item) => {
    const key = keyForItem(item);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36",
    },
  });
  const body = await response.text();

  if (!response.ok || body.includes("cf_challenge") || body.includes("Enable JavaScript and cookies")) {
    throw new Error(
      `Unable to fetch ${url}. ArtStation returned status ${response.status}; run with --manifest when Cloudflare blocks direct imports.`,
    );
  }

  return body;
}

function parseProjectList(html, baseUrl) {
  const projectLinks = [];
  const linkRegex = /<a\b[^>]*href=["']([^"']*\/projects\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const sourceUrl = toAbsoluteUrl(match[1], baseUrl).replace(/#.*$/, "");
    const title = stripTags(match[2]);
    const imageMatch = match[2].match(/<img\b[^>]*src=["']([^"']+)["']/i);
    const coverImage = imageMatch ? toAbsoluteUrl(imageMatch[1], baseUrl) : "";

    if (title && sourceUrl.includes("/projects/")) {
      projectLinks.push({ title, sourceUrl, coverImage });
    }
  }

  return uniqueBy(projectLinks, (project) => project.sourceUrl);
}

function parseProjectPage(html, project) {
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch
    ? stripTags(titleMatch[1]).replace(/^Mike Nevins\s*-\s*/i, "")
    : project.title;

  const imageUrls = [];
  const assetRegex = /(?:href|src)=["']([^"']*artstation\.com\/p\/assets\/[^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi;
  let assetMatch;

  while ((assetMatch = assetRegex.exec(html)) !== null) {
    imageUrls.push(
      toAbsoluteUrl(assetMatch[1], project.sourceUrl)
        .replace("/smaller_square/", "/large/")
        .replace("/medium/", "/large/"),
    );
  }

  const iframeMatch = html.match(/<iframe\b[^>]*src=["']([^"']+)["']/i);
  const embedUrl = iframeMatch ? toAbsoluteUrl(iframeMatch[1], project.sourceUrl) : undefined;
  const descriptionMatch = html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  const description = descriptionMatch ? decodeHtml(descriptionMatch[1]).trim() : "";

  return {
    ...project,
    title,
    description,
    embedUrl,
    images: uniqueBy(imageUrls, (url) => url),
  };
}

async function loadProjects() {
  if (manifestPath) {
    const manifest = JSON.parse(await readFile(path.resolve(root, manifestPath), "utf8"));
    return manifest.projects;
  }

  const indexHtml = await fetchText(sourceUrl);
  const projectLinks = parseProjectList(indexHtml, sourceUrl);

  return Promise.all(
    projectLinks.map(async (project) => {
      const projectHtml = await fetchText(project.sourceUrl);
      return parseProjectPage(projectHtml, project);
    }),
  );
}

async function downloadAsset(url, targetPath) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36",
      Referer: "https://kvick.artstation.com/",
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to download ${url}: ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(targetPath, bytes);
}

function makeLocalFileName(url, index) {
  const parsed = new URL(url);
  const ext = path.extname(parsed.pathname) || ".jpg";
  const baseName = safeFileName(path.basename(parsed.pathname, ext)) || `image-${index + 1}`;

  return `${String(index + 1).padStart(2, "0")}-${baseName}${ext.toLowerCase()}`;
}

async function localizeProject(project, usedSlugs) {
  const baseSlug = slugify(project.title, path.basename(new URL(project.sourceUrl).pathname).toLowerCase());
  let slug = baseSlug;
  let suffix = 2;

  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  usedSlugs.add(slug);

  const projectDir = path.join(outputRoot, slug);
  await mkdir(projectDir, { recursive: true });

  const images = [];

  for (const [index, imageUrl] of project.images.entries()) {
    const fileName = makeLocalFileName(imageUrl, index);
    const targetPath = path.join(projectDir, fileName);
    await downloadAsset(imageUrl, targetPath);
    images.push(`/Resources/ArtStation/${slug}/${fileName}`);
  }

  return {
    slug,
    title: project.title,
    description: project.description || undefined,
    sourceUrl: project.sourceUrl,
    coverImage: images[0] ?? "",
    images,
    embedUrl: project.embedUrl,
  };
}

function formatOptionalString(key, value, indent = "  ") {
  return value ? `${indent}${key}: ${JSON.stringify(value)},\n` : "";
}

function formatStringArray(values, indent = "    ") {
  const childIndent = `${indent}  `;
  return `[\n${values.map((value) => `${childIndent}${JSON.stringify(value)}`).join(",\n")}\n${indent}]`;
}

function formatArtPiece(piece) {
  return `  {
    slug: ${JSON.stringify(piece.slug)},
    title: ${JSON.stringify(piece.title)},
${formatOptionalString("description", piece.description, "    ")}    sourceUrl: ${JSON.stringify(piece.sourceUrl)},
    coverImage: ${JSON.stringify(piece.coverImage)},
    images: ${formatStringArray(piece.images)},
${formatOptionalString("embedUrl", piece.embedUrl, "    ")}  }`;
}

async function writeDataFile(pieces) {
  const contents = `import type { ArtPiece } from "./types";

export const artPieces: ArtPiece[] = [
${pieces.map(formatArtPiece).join(",\n")}
];

export function getArtPiece(slug: string | null) {
  if (!slug) {
    return null;
  }

  return artPieces.find((piece) => piece.slug === slug) ?? null;
}
`;

  await writeFile(dataOutputPath, contents);
}

const importedProjects = await loadProjects();
const projectsWithImages = importedProjects.filter((project) => project.images?.length);
const usedSlugs = new Set();
const localizedPieces = [];

for (const project of projectsWithImages) {
  localizedPieces.push(await localizeProject(project, usedSlugs));
}

await writeDataFile(localizedPieces);

console.log(
  `Imported ${localizedPieces.length} ArtStation pieces with ${localizedPieces.reduce(
    (total, piece) => total + piece.images.length,
    0,
  )} local image assets.`,
);
