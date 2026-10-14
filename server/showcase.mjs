import { createServer } from "node:http";
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { readFile, realpath, stat, mkdir, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scrypt = promisify(scryptCallback);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const production = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 4175);
const origin = process.env.PUBLIC_ORIGIN || `http://127.0.0.1:${port}`;
const publicRoot = path.join(root, "dist");
const privateRoot = process.env.STUDIO_CONTENT_ROOT;
if (!privateRoot)
  throw new Error(
    "Set STUDIO_CONTENT_ROOT to the separate private content directory.",
  );
if (
  production &&
  (!origin.startsWith("https://") || !process.env.STUDIO_PASSWORD_HASH)
)
  throw new Error(
    "Production requires PUBLIC_ORIGIN=https://... and STUDIO_PASSWORD_HASH.",
  );
const localDir = process.env.SHOWCASE_STATE_ROOT || path.join(root, ".local");
const configPath = path.join(localDir, "showcase.json");
await mkdir(localDir, { recursive: true });
export async function hashPassword(password) {
  const salt = randomBytes(24).toString("hex");
  return `${salt}:${(await scrypt(password, salt, 64)).toString("hex")}`;
}
let passwordHash = process.env.STUDIO_PASSWORD_HASH;
let initialPassword = "";
if (!passwordHash) {
  try {
    passwordHash = JSON.parse(await readFile(configPath, "utf8")).passwordHash;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (!passwordHash) {
    initialPassword = randomBytes(18).toString("base64url");
    passwordHash = await hashPassword(initialPassword);
    await writeFile(configPath, JSON.stringify({ passwordHash }), {
      mode: 0o600,
    });
  }
}
if (!/^[a-f0-9]{48}:[a-f0-9]{128}$/.test(passwordHash))
  throw new Error("Invalid password hash configuration.");
const setupToken = !production ? randomBytes(32).toString("hex") : "";
if (!production)
  await writeFile(
    path.join(localDir, "owner-url.txt"),
    `${origin}/_owner/${setupToken}`,
    { mode: 0o600 },
  );
const sessions = new Map();
const attempts = new Map();
const cookieName = production ? "__Host-studio" : "studio_session";
const cookieBase = `Path=/; HttpOnly; SameSite=Strict${production ? "; Secure" : ""}`;
const ttl = 4 * 60 * 60 * 1000;
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function page(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>${title} | Michael Nevins</title><link rel="stylesheet" href="/studio-access.css"></head><body><header><a href="/portfolio">Michael Nevins</a><a href="/portfolio">Back to portfolio</a></header><main class="access"><h1>${title}</h1>${body}</main></body></html>`;
}
const login = (message = "") =>
  page(
    "Private UI showcase",
    `<p>A closer look at Dreamatron. Unreleased interfaces and work in progress, shared for client conversations.</p>${message ? `<p role="alert">${escape(message)}</p>` : ""}<form method="post" action="/studio/login"><label for="password">Shared password</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="256"><button type="submit">View showcase</button></form><p class="note">Need access? <a href="https://www.linkedin.com/in/michael-nevins-690b3140/">Get in touch with Michael.</a></p>`,
  );
function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    ...headers,
  });
  res.end(body);
}
async function body(req) {
  let result = "";
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 2048)
      throw Object.assign(new Error("Request too large"), { status: 413 });
    result += chunk.toString();
  }
  return new URLSearchParams(result);
}
function token(req) {
  return req.headers.cookie
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
}
function authorized(req) {
  const t = token(req);
  const expires = sessions.get(t);
  if (expires && expires > Date.now()) return true;
  sessions.delete(t);
  return false;
}
async function serveFile(req, res, base, rel, fallback = false) {
  const baseReal = await realpath(base);
  let filename = path.resolve(baseReal, rel);
  if (
    !filename.startsWith(baseReal + path.sep) ||
    rel.includes("\\") ||
    rel.split("/").some((x) => x.startsWith("."))
  )
    return send(res, 404, "Not found");
  try {
    filename = await realpath(filename);
  } catch (error) {
    if (!fallback || path.extname(rel)) return send(res, 404, "Not found");
    filename = path.join(baseReal, "index.html");
  }
  if (!filename.startsWith(baseReal + path.sep))
    return send(res, 404, "Not found");
  const info = await stat(filename);
  if (!info.isFile()) return send(res, 404, "Not found");
  const mime = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ttf": "font/ttf",
    ".pdf": "application/pdf",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
  };
  let start = 0,
    end = info.size - 1,
    status = 200;
  if (req.headers.range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (!match || (!match[1] && !match[2]))
      return send(res, 416, "Invalid range", {
        "Content-Range": `bytes */${info.size}`,
      });
    start = match[1]
      ? Number(match[1])
      : Math.max(0, info.size - Number(match[2]));
    end = match[1] && match[2] ? Math.min(Number(match[2]), end) : end;
    if (start > end || start >= info.size)
      return send(res, 416, "Invalid range", {
        "Content-Range": `bytes */${info.size}`,
      });
    status = 206;
    res.setHeader("Content-Range", `bytes ${start}-${end}/${info.size}`);
  }
  res.writeHead(status, {
    "Content-Type": mime[path.extname(filename)] || "application/octet-stream",
    "Content-Length": end - start + 1,
    "Accept-Ranges": "bytes",
  });
  if (req.method === "HEAD") return res.end();
  createReadStream(filename, { start, end })
    .on("error", () => res.destroy())
    .pipe(res);
}
const server = createServer(async (req, res) => {
  if (req.headers.host !== new URL(origin).host)
    return send(res, 400, "Invalid host");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("X-Frame-Options", "DENY");
  const url = new URL(req.url, origin);
  const isPrivate =
    url.pathname.startsWith("/studio") || url.pathname.startsWith("/_owner");
  if (isPrivate) {
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; style-src 'self'; img-src 'self'; font-src 'self'; script-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    );
  }
  if (production)
    res.setHeader("Strict-Transport-Security", "max-age=31536000");
  try {
    if (!["GET", "HEAD", "POST"].includes(req.method))
      return send(res, 405, "Method not allowed");
    if (req.method === "POST" && req.headers.origin !== origin)
      return send(res, 403, "Origin not allowed");
    if (!production && url.pathname === `/_owner/${setupToken}`) {
      if (req.method === "POST") {
        const form = await body(req);
        const next = form.get("password") || "";
        if (next.length < 16 || next.length > 256)
          return send(
            res,
            400,
            page(
              "Choose a longer password",
              "<p>Use between 16 and 256 characters. Go back and try again.</p>",
            ),
          );
        passwordHash = await hashPassword(next);
        await writeFile(configPath, JSON.stringify({ passwordHash }), {
          mode: 0o600,
        });
        sessions.clear();
        initialPassword = "";
        return send(
          res,
          200,
          page(
            "Password updated",
            '<p>All previous sessions have been signed out.</p><a href="/studio/">Open the showcase</a>',
          ),
        );
      }
      return send(
        res,
        200,
        page(
          "Showcase access",
          `<p>This owner page is available only in the local preview. Share the password with invited clients once the site is hosted.</p>${initialPassword ? `<label>Initial shared password</label><p class="password">${escape(initialPassword)}</p>` : "<p>A password is already configured. You can replace it below.</p>"}<form method="post"><label for="password">Set a new shared password</label><input id="password" name="password" type="password" autocomplete="new-password" minlength="16" maxlength="256" required><button>Update password</button></form><p><a href="/studio/">Open the private showcase</a></p>`,
        ),
      );
    }
    if (url.pathname.startsWith("/_owner")) return send(res, 404, "Not found");
    if (url.pathname === "/studio/login" && req.method === "POST") {
      // All failures share a bounded process-wide budget as well as per-peer limits.
      // Proxy-supplied IP headers are deliberately not trusted.
      const peer = req.socket.remoteAddress;
      const now = Date.now();
      const windowMs = 15 * 60 * 1000;
      for (const key of [peer, "global"]) {
        const old = attempts.get(key);
        if (old && old.until < now) attempts.delete(key);
      }
      if (
        (attempts.get(peer)?.count || 0) >= 10 ||
        (attempts.get("global")?.count || 0) >= 100
      )
        return send(
          res,
          429,
          login("Too many attempts. Please try again in 15 minutes."),
          { "Retry-After": "900" },
        );
      for (const key of [peer, "global"]) {
        const old = attempts.get(key);
        attempts.set(key, {
          count: (old?.count || 0) + 1,
          until: old?.until || now + windowMs,
        });
      }
      const form = await body(req);
      const password = form.get("password") || "";
      const [salt, expected] = passwordHash.split(":");
      const actual = await scrypt(password, salt, 64);
      if (!timingSafeEqual(actual, Buffer.from(expected, "hex")))
        return send(
          res,
          401,
          login("That password did not match. Please try again."),
        );
      attempts.delete(peer);
      if (sessions.size >= 1000) sessions.delete(sessions.keys().next().value);
      const session = randomBytes(32).toString("hex");
      sessions.set(session, now + ttl);
      return send(res, 303, "", {
        Location: "/studio/",
        "Set-Cookie": `${cookieName}=${session}; ${cookieBase}; Max-Age=${ttl / 1000}`,
      });
    }
    if (url.pathname === "/studio/logout" && req.method === "POST") {
      sessions.delete(token(req));
      return send(res, 303, "", {
        Location: "/studio/",
        "Set-Cookie": `${cookieName}=; ${cookieBase}; Max-Age=0`,
      });
    }
    if (req.method === "POST") return send(res, 405, "Method not allowed");
    if (url.pathname === "/studio-access.css")
      return await serveFile(req, res, publicRoot, "studio-access.css");
    if (url.pathname === "/studio" || url.pathname.startsWith("/studio/")) {
      if (!authorized(req))
        return send(
          res,
          url.pathname === "/studio" || url.pathname === "/studio/" ? 200 : 401,
          login(),
        );
      const rel =
        decodeURIComponent(url.pathname.replace(/^\/studio\/?/, "")) ||
        "index.html";
      if (
        ![
          "index.html",
          "studio.css",
          "studio.js",
          "assets/auteur-workspace.webp",
          "assets/auteur-timeline.webp",
          "assets/auteur-audio.webp",
          "assets/auteur-inspector.webp",
        ].includes(rel)
      )
        return send(res, 404, "Not found");
      return await serveFile(req, res, privateRoot, rel);
    }
    const rel = decodeURIComponent(url.pathname.slice(1)) || "index.html";
    return await serveFile(req, res, publicRoot, rel, true);
  } catch (error) {
    if (!res.headersSent)
      send(res, error.status || 500, "Request could not be completed.");
    else res.destroy();
  }
});
setInterval(() => {
  const now = Date.now();
  for (const [key, expires] of sessions)
    if (expires < now) sessions.delete(key);
  for (const [key, value] of attempts)
    if (value.until < now) attempts.delete(key);
}, 60000).unref();
server.listen(port, production ? "0.0.0.0" : "127.0.0.1", () =>
  console.log(`Portfolio preview: ${origin}`),
);
