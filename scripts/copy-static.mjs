import { cp, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");

await mkdir(dist, { recursive: true });

const resourcesSource = path.join(root, "Resources");
const resourcesTarget = path.join(dist, "Resources");

if (existsSync(resourcesSource)) {
  await cp(resourcesSource, resourcesTarget, { recursive: true, force: true });
}

const cnameSource = path.join(root, "CNAME");
const cnameTarget = path.join(dist, "CNAME");

if (existsSync(cnameSource)) {
  await copyFile(cnameSource, cnameTarget);
}

const indexPath = path.join(dist, "index.html");
const fallbackPath = path.join(dist, "404.html");

if (existsSync(indexPath)) {
  await copyFile(indexPath, fallbackPath);
}
