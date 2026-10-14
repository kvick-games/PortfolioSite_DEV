import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes, scryptSync } from "node:crypto";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

test("private page and media require a valid server session", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "portfolio-auth-"));
  const content = path.join(dir, "content");
  await mkdir(path.join(content, "assets"), { recursive: true });
  await writeFile(path.join(content, "index.html"), "PRIVATE_TEST_CONTENT");
  await writeFile(
    path.join(content, "assets/auteur-workspace.webp"),
    "PRIVATE_IMAGE_BYTES",
  );
  await writeFile(path.join(content, "sources.json"), "PRIVATE_SOURCE_PATHS");
  const password = randomBytes(20).toString("base64url");
  const salt = randomBytes(24).toString("hex");
  const hash = salt + ":" + scryptSync(password, salt, 64).toString("hex");
  const origin = "http://127.0.0.1:4176";
  const proc = spawn(process.execPath, ["server/showcase.mjs"], {
    env: {
      ...process.env,
      PORT: "4176",
      PUBLIC_ORIGIN: origin,
      NODE_ENV: "test",
      STUDIO_PASSWORD_HASH: hash,
      STUDIO_CONTENT_ROOT: content,
      SHOWCASE_STATE_ROOT: path.join(dir, "state"),
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Server start timeout")),
        10000,
      );
      proc.stdout.once("data", () => {
        clearTimeout(timeout);
        resolve();
      });
      proc.once("exit", (code) => {
        clearTimeout(timeout);
        reject(new Error("Server exited " + code));
      });
    });
    const get = (url, headers = {}) =>
      fetch(origin + url, { headers, redirect: "manual" });
    const post = (url, passwordValue, headers = {}) =>
      fetch(origin + url, {
        method: "POST",
        headers: {
          Origin: origin,
          "Content-Type": "application/x-www-form-urlencoded",
          ...headers,
        },
        body: new URLSearchParams({ password: passwordValue }),
        redirect: "manual",
      });
    let res = await get("/studio/");
    assert.equal(res.status, 200);
    assert(!(await res.text()).includes("PRIVATE_TEST_CONTENT"));
    for (const file of [
      "/studio/index.html",
      "/studio/assets/auteur-workspace.webp",
      "/studio/studio.js",
      "/studio/sources.json",
    ]) {
      res = await get(file);
      assert.equal(res.status, 401);
      assert.match(res.headers.get("cache-control"), /no-store/);
    }
    res = await post("/studio/login", password, {
      Origin: "https://attacker.example",
    });
    assert.equal(res.status, 403);
    res = await post("/studio/login", "wrong");
    assert.equal(res.status, 401);
    res = await post("/studio/login", password);
    assert.equal(res.status, 303);
    const cookie = res.headers.get("set-cookie").split(";")[0];
    assert.match(res.headers.get("set-cookie"), /HttpOnly; SameSite=Strict/);
    res = await get("/studio/", { Cookie: cookie });
    assert.equal(await res.text(), "PRIVATE_TEST_CONTENT");
    assert.match(res.headers.get("x-robots-tag"), /noindex/);
    res = await get("/studio/assets/auteur-workspace.webp", { Cookie: cookie });
    assert.equal(await res.text(), "PRIVATE_IMAGE_BYTES");
    for (const url of [
      "/studio/sources.json",
      "/studio/README.md",
      "/studio/%2e%2e%2f.local/showcase.json",
      "/studio/assets%5c..%5c..%5c.local%5cshowcase.json",
    ]) {
      res = await get(url, { Cookie: cookie });
      assert.equal(res.status, 404);
    }
    res = await get("/studio/", { Cookie: "studio_session=forged" });
    assert(!(await res.text()).includes("PRIVATE_TEST_CONTENT"));
    res = await post("/studio/logout", "", { Cookie: cookie });
    assert.equal(res.status, 303);
    res = await get("/studio/assets/auteur-workspace.webp", { Cookie: cookie });
    assert.equal(res.status, 401);
    for (let i = 0; i < 10; i++) await post("/studio/login", "wrong");
    res = await post("/studio/login", password);
    assert.equal(res.status, 429);
    res = await fetch(origin + "/studio/login", {
      method: "POST",
      headers: { Origin: origin },
      body: "x".repeat(5000),
    });
    assert([413, 429].includes(res.status));
    res = await get("/.local/showcase.json");
    assert.equal(res.status, 404);
  } finally {
    proc.kill();
    await new Promise((resolve) => proc.once("exit", resolve));
    assert(
      path
        .resolve(dir)
        .startsWith(path.resolve(tmpdir()) + path.sep + "portfolio-auth-"),
    );
    await rm(dir, { recursive: true, force: true });
  }
});
