import { useEffect, useRef } from "react";
import "../section-shaders.css";

/*
  One fixed WebGL canvas behind the home page. Each portfolio section has its
  own fragment shader (a "scene"); the section that holds the middle of the
  viewport picks the scene, and scenes crossfade additively on a black ground.

  Budget: about half the CSS resolution (DPR ignored), at most 30 fps, drawn
  from a worker where the browser allows it, and paused when the tab is
  hidden, in the light theme, or on a section with no scene. If WebGL is
  missing or would run in software, nothing renders and the page looks
  exactly as it does without this component.
*/

type SceneId =
  | "gow"
  | "judas"
  | "tanuki"
  | "ewa"
  | "levelgen"
  | "dreamatron"
  | "paintings";

const SECTIONS: ReadonlyArray<readonly [string, SceneId | null]> = [
  [".hero, .splash", null],
  [".chapter--gow", "gow"],
  [".chapter--judas", "judas"],
  [".chapter--tanuki", "tanuki"],
  [".chapter--ewa", "ewa"],
  [".chapter--tools", "levelgen"],
  [".chapter--dreamatron", "dreamatron"],
  [".chapter--paint", "paintings"],
  [".chapter--about", null],
];

const DEV =
  (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;
const FADE_MS = 800;
const FRAME_MS = 1000 / 30;
const MAX_PIXELS = 560_000;
/* The time a reduced-motion still is rendered at, chosen to look settled. */
const STILL_TIME = 47.0;

/* Shared GLSL ------------------------------------------------------------ */

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const COMMON = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;       // canvas size in render pixels
uniform float uTime;     // seconds
uniform float uFade;     // crossfade weight, 0..1
uniform float uMotion;   // 0 under reduced motion
uniform float uScale;    // render pixels per CSS pixel
uniform vec2 uPointer;   // smoothed pointer, -1..1
uniform float uProgress; // section scroll progress through the viewport, 0..1
uniform float uScroll;   // section parallax offset in CSS pixels

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
             mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}
const mat2 ROT = mat2(1.6, 1.2, -1.2, 1.6);
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = ROT * p; a *= 0.5; }
  return s / 0.9375;
}
float fbm3(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = ROT * p; a *= 0.5; }
  return s / 0.875;
}
// Aspect-correct position: y in -0.5..0.5, x scaled by aspect.
vec2 scenePos() { return (gl_FragCoord.xy - 0.5 * uRes) / uRes.y; }
// Film grain, re-rolled about 15 times a second (frozen under reduced motion).
float grain() {
  float f = floor(uTime * 15.0) * uMotion;
  return hash12(gl_FragCoord.xy + vec2(f * 17.3, f * 29.1)) - 0.5;
}
vec4 finish(vec3 c) {
  // Dither so the very dark gradients do not band; true black stays black.
  float lit = step(0.0015, max(c.r, max(c.g, c.b)));
  c += (hash12(gl_FragCoord.xy * 1.37 + 11.0) - 0.5) / 255.0 * lit;
  return vec4(max(c, 0.0) * uFade, 1.0);
}
`;

/* Scenes ------------------------------------------------------------------ */

const SCENES: Record<SceneId, string> = {
  /* God of War menus: cold teal mist over slate, rising frost motes, vignette. */
  gow: `
float motes(vec2 p, float cells, float speed, float seed, float r) {
  vec2 q = p * cells;
  q.y -= uTime * speed;
  q.x += sin(q.y * 0.6 + seed * 3.0) * 0.3;
  vec2 id = floor(q);
  vec2 f = fract(q) - 0.5;
  float h = hash12(id + seed * 17.0);
  vec2 o = (hash22(id + seed * 31.0) - 0.5) * 0.55;
  float d2 = dot(f - o, f - o);
  float life = 0.5 + 0.5 * sin(uTime * (0.3 + h * 0.5) + h * 40.0);
  float on = step(0.88, h);
  return on * life * life * (exp(-d2 / (r * r)) + 0.22 * exp(-d2 / (9.0 * r * r)));
}
void main() {
  vec2 p = scenePos();
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 m = p + uPointer * 0.012 + vec2(0.0, uProgress * 0.18);
  float t = uTime * 0.022;
  vec2 q = vec2(fbm3(m * 1.3 + vec2(0.0, t)),
                fbm3(m * 1.3 + vec2(5.2, 1.3) - vec2(t * 0.8, 0.0)));
  float n = fbm(m * vec2(0.9, 1.4) + 1.15 * q + vec2(t * 0.9, -t * 0.35));
  // A second, broader layer drifting the other way gives the mist depth.
  float billow = vnoise(m * vec2(0.8, 1.6) - vec2(t * 1.4, 0.0));
  float dense = smoothstep(0.30, 0.88, n * 0.8 + billow * 0.25);
  vec3 deep = vec3(0.004, 0.013, 0.018);
  vec3 teal = mix(vec3(0.026, 0.066, 0.080), vec3(0.020, 0.050, 0.082), q.x);
  vec3 frost = vec3(0.036, 0.074, 0.080);
  vec3 col = deep + teal * dense + frost * dense * dense * dense;
  // Vignette: the mist pools in the middle and thins toward the edges. The
  // section's media fill the middle, so the margins keep some of it.
  vec2 v = (uv - 0.5) * vec2(1.15, 1.3);
  col *= mix(0.5, 1.0, smoothstep(0.85, 0.15, length(v)));
  // Frost motes, two depths; a rare few are embers.
  float far = motes(p + uPointer * 0.006, 10.0, 0.26, 1.0, 0.045);
  float near = motes(p + uPointer * 0.016, 5.0, 0.21, 7.0, 0.035);
  float ember = motes(p + uPointer * 0.02, 3.0, 0.16, 13.0, 0.022);
  col += vec3(0.30, 0.48, 0.54) * far * 0.35 + vec3(0.42, 0.66, 0.74) * near * 0.45
       + vec3(0.62, 0.30, 0.12) * ember * 0.35;
  gl_FragColor = finish(col);
}`,

  /* Judas: one cold shaft through dust, a deep red smoulder low, film grain. */
  judas: `
float dust(vec2 p, float cells, float seed, float r) {
  vec2 q = p * cells + vec2(uTime * 0.05, uTime * 0.035);
  vec2 id = floor(q);
  vec2 f = fract(q) - 0.5;
  float h = hash12(id + seed);
  vec2 o = (hash22(id + seed * 7.0) - 0.5) * 0.72
         + 0.07 * vec2(sin(uTime * 0.31 + h * 21.0), cos(uTime * 0.23 + h * 13.0));
  float d2 = dot(f - o, f - o);
  float tw = 0.55 + 0.45 * sin(uTime * (0.6 + h) + h * 30.0);
  return step(0.62, h) * tw * exp(-d2 / (r * r)) * (0.4 + 0.6 * fract(h * 7.31));
}
void main() {
  vec2 p = scenePos();
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  float t = uTime;
  // The shaft enters at the top, just right of centre, and falls down-left
  // through the gutter between the still and the copy.
  float sway = 0.035 * sin(t * 0.07);
  vec2 src = vec2(0.10 * asp + uPointer.x * 0.01, 0.78);
  vec2 dir = normalize(vec2(-0.42 + sway, -1.0));
  vec2 rel = p - src;
  float along = dot(rel, dir);
  float perp = dot(rel, vec2(-dir.y, dir.x));
  float width = 0.05 + along * 0.17;
  float core = smoothstep(width, width * 0.15, abs(perp));
  float halo = exp(-abs(perp) / (width * 1.6));
  float reach = smoothstep(0.0, 0.25, along) * exp(-along * 0.9);
  float smoke = fbm3(vec2(perp * 5.0, along * 2.2 - t * 0.06) + vec2(0.0, uProgress));
  float shaft = (core * (0.45 + 0.75 * smoke) + halo * 0.25) * reach;
  vec3 col = vec3(0.050, 0.082, 0.105) * shaft;
  // Cold ambient on the left, deep red smoulder low and to the right.
  float ember = fbm3(p * 1.6 + vec2(t * 0.02, t * 0.012));
  float low = smoothstep(0.75, 0.0, length((uv - vec2(0.82, -0.05)) * vec2(asp * 0.6, 1.0)));
  col += vec3(0.052, 0.010, 0.008) * low * smoothstep(0.3, 0.8, ember);
  col += vec3(0.004, 0.012, 0.016) * smoothstep(0.9, 0.0, uv.x) * smoothstep(0.0, 0.6, uv.y);
  // Dust lit by the shaft; a faint sprinkle outside it.
  float d = dust(p, 22.0, 3.0, 0.07) + dust(p * 0.6, 22.0, 9.0, 0.05) * 0.7;
  col += vec3(0.30, 0.40, 0.46) * d * (0.02 + shaft * 1.4);
  // Grain rides on the light only, so black stays black.
  float g = grain();
  col += col * g * 0.6 + g * 0.003;
  col *= smoothstep(1.05, 0.25, length((uv - 0.5) * vec2(1.1, 1.3)));
  gl_FragColor = finish(col);
}`,

  /* Tanuki: dappled sun through leaves, amber drifting toward dusk rose. */
  tanuki: `
void main() {
  vec2 p = scenePos();
  float asp = uRes.x / uRes.y;
  float t = uTime;
  vec2 wind = vec2(sin(t * 0.21) + 0.5 * sin(t * 0.47 + 1.0), 0.6 * cos(t * 0.17)) * 0.035;
  // Sun spots: soft round pinhole images of the sun, on a jittered grid.
  vec2 q = (p + wind * 0.6) * vec2(5.2, 6.0) + vec2(t * 0.012, 0.0);
  q += (vec2(vnoise(q * 0.7 + 3.0), vnoise(q * 0.7 + 9.0)) - 0.5) * 0.9;
  vec2 id = floor(q);
  vec2 f = fract(q);
  // Each spot has its own size and strength, so the light never tiles.
  float spot = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 h = hash22(id + g);
      vec2 o = 0.5 + 0.38 * sin(t * 0.12 + 6.2831 * h);
      float r = 0.16 + 0.30 * h.y;
      float d = length(g + o - f);
      spot = max(spot, smoothstep(r, r * 0.25, d) * (0.35 + 0.65 * h.x));
    }
  }
  // The canopy decides which spots get through; it sways with the wind.
  float canopy = fbm3(p * 2.1 + wind * 5.0 + vec2(t * 0.012, -t * 0.007));
  float gap = smoothstep(0.50, 0.66, canopy);
  float wash = smoothstep(0.38, 0.85, canopy);
  float fall = smoothstep(1.45, 0.0, length(p - vec2(0.38 * asp, 0.40)));
  float dusk = 0.5 + 0.5 * sin(t * 0.03 - 1.2);
  vec3 sun = mix(vec3(0.105, 0.070, 0.028), vec3(0.100, 0.045, 0.036), dusk);
  vec3 leaf = vec3(0.012, 0.024, 0.010);
  vec3 col = leaf * (1.0 - gap) * fall + sun * (spot * gap * 0.9 + wash * 0.22) * fall;
  gl_FragColor = finish(col);
}`,

  /* EWA: near black, a red undertone, darkness creeping in from the edges, a
     failing-bulb flicker now and then, and grain. */
  ewa: `
void main() {
  vec2 p = scenePos();
  vec2 uv = gl_FragCoord.xy / uRes;
  float t = uTime * 0.018;
  float n = fbm(p * 1.7 + vec2(t, -t * 0.6) + vec2(0.0, uProgress * 0.2));
  float haze = smoothstep(0.35, 0.85, n);
  vec3 col = vec3(0.070, 0.008, 0.007) * haze + vec3(0.013, 0.002, 0.002);
  // Darkness creeps in: a ragged edge that breathes slowly inward.
  float r = length((uv - 0.5) * vec2(1.25, 1.1));
  float edge = 0.56 - 0.08 * (0.5 + 0.5 * sin(uTime * 0.06));
  float rag = (fbm3(p * 3.2 + vec2(uTime * 0.015, -uTime * 0.02)) - 0.5) * 0.45;
  col *= 1.0 - smoothstep(edge - 0.22, edge, r + rag);
  // Flicker: about one window in seven, a bulb that cannot hold.
  float win = step(0.86, hash12(vec2(floor(uTime / 2.9), 7.0)));
  float k = hash12(vec2(floor(uTime * 11.0), 3.0));
  float flick = 1.0 - win * step(0.5, k) * 0.65 + win * step(0.93, k) * 0.5;
  col *= mix(1.0, flick, uMotion);
  float g = grain();
  col += col * g * 0.9 + g * 0.004;
  gl_FragColor = finish(col);
}`,

  /* Level Generator: a blueprint grid, a scan sweeping down, rooms that are
     "generated" as it passes and then fade. Measured in CSS pixels. */
  levelgen: `
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 css = gl_FragCoord.xy / uScale;
  float hCss = uRes.y / uScale;
  css.y = hCss - css.y;                 // top-down, like the page
  vec2 g = css + vec2(0.0, uScroll);    // the grid drifts slower than the page
  float px = 1.0 / uScale;              // one render pixel, in CSS pixels
  const float MINOR = 32.0;
  const float MAJOR = 160.0;
  vec2 dm = abs(fract(g / MINOR - 0.5) - 0.5) * MINOR;
  float lineMinor = 1.0 - smoothstep(0.0, px, min(dm.x, dm.y));
  vec2 dM = abs(fract(g / MAJOR - 0.5) - 0.5) * MAJOR;
  float lineMajor = 1.0 - smoothstep(0.0, px * 1.25, min(dM.x, dM.y));
  // One room per major cell, snapped to the minor grid.
  vec2 id = floor(g / MAJOR);
  vec2 u = (g - id * MAJOR) / MINOR;    // 0..5
  vec2 ha = hash22(id + 4.0);
  vec2 hb = hash22(id + 19.0);
  vec2 lo = floor(ha * 2.0);
  vec2 hi = min(vec2(5.0), lo + 2.0 + floor(hb * 3.0));
  vec2 inLo = u - lo;
  vec2 inHi = hi - u;
  float inside = step(0.0, min(min(inLo.x, inLo.y), min(inHi.x, inHi.y)));
  float bd = min(min(inLo.x, inLo.y), min(inHi.x, inHi.y)) * MINOR;
  float border = inside * (1.0 - smoothstep(0.0, px * 1.5, bd));
  // The sweep runs top to bottom; each room it passes may light up.
  const float PERIOD = 9.0;
  float cy = ((id.y + 0.5) * MAJOR - uScroll) / hCss;
  float ph = uTime / PERIOD - (cy + 0.1) / 1.2;
  float age = fract(ph) * PERIOD;
  float on = step(0.58, hash12(id * 1.7 + floor(ph) * 13.7));
  float lit = on * smoothstep(0.0, 0.12, age) * exp(-age * 0.55);
  float sweepY = fract(uTime / PERIOD) * 1.2 - 0.1;
  float y = css.y / hCss;
  float sweep = exp(-pow((y - sweepY) * hCss / 1.6, 2.0)) * 0.7
              + step(y, sweepY) * exp(-(sweepY - y) * 9.0) * 0.12;
  // Fade toward the edges and behind the copy column on the left.
  float mask = smoothstep(0.95, 0.2, length((uv - vec2(0.58, 0.5)) * vec2(1.0, 1.25)));
  mask *= mix(0.4, 1.0, smoothstep(0.12, 0.42, uv.x));
  vec3 ink = vec3(0.30, 0.55, 0.78);
  float v = lineMinor * 0.035 + lineMajor * 0.055
          + border * lit * 0.30 + inside * lit * 0.045
          + sweep * 0.08;
  vec3 col = ink * v * mask;
  gl_FragColor = finish(col);
}`,

  /* Dreamatron: almost nothing. A vermilion glow breathing at the edges and a
     few faint horizontal streaks, so the timeline keeps the stage. */
  dreamatron: `
void main() {
  vec2 p = scenePos();
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  // Mostly the lower edge and the sides; the top stays clean.
  float e = min(min(uv.x, 1.0 - uv.x) * asp * 1.2, min(uv.y * 1.2, (1.0 - uv.y) * 4.0));
  float edge = exp(-e * 8.0);
  float breathe = fbm3(p * 1.4 + vec2(uTime * 0.025, uTime * 0.017));
  vec3 verm = vec3(0.949, 0.282, 0.106);
  vec3 col = verm * edge * (0.010 + 0.034 * smoothstep(0.4, 0.85, breathe));
  float row = p.y * 34.0;
  float sid = floor(row);
  float hs = hash12(vec2(sid, 2.0));
  float band = smoothstep(0.5, 0.0, abs(fract(row) - 0.5)) ;
  float run = vnoise(vec2(p.x * 2.6 - uTime * (0.04 + hs * 0.06), sid * 3.1));
  float streak = band * band * step(0.8, hs) * smoothstep(0.7, 0.95, run);
  col += mix(verm, vec3(0.9, 0.86, 0.8), 0.4) * streak * 0.022;
  gl_FragColor = finish(col);
}`,

  /* Paintings: paper grain under two slow glazes of muted pigment, each with
     the darker, granulated edge watercolour leaves as it dries. */
  paintings: `
// A pale wash with a thin, darker tide line where it dried.
float glaze(float n, float lo) {
  float body = smoothstep(lo, lo + 0.22, n);
  float tide = exp(-pow((n - lo - 0.012) / 0.018, 2.0));
  return body * 0.35 + tide * 0.65;
}
void main() {
  vec2 p = scenePos();
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 css = gl_FragCoord.xy / uScale;
  float paper = vnoise(css * 0.55) * 0.55 + vnoise(css * 0.13 + 7.0) * 0.45;
  float granulate = vnoise(css * 0.09 + 3.0);
  float t = uTime * 0.011;
  vec2 q = p + vec2(0.0, uProgress * 0.3);
  // Warm glaze (ochre into oxide red) and a cool one (indigo into sap green).
  vec2 w = vec2(vnoise(q * 3.0 + t), vnoise(q * 3.0 - t + 4.0)) * 0.18;
  float a = fbm(q * 1.5 + w + vec2(t, -t * 0.7));
  float b = fbm3(q * 2.3 - w - vec2(t * 0.6, -t * 0.4) + 5.7);
  float hue = vnoise(q * 0.9 + 2.0);
  vec3 warm = mix(vec3(0.074, 0.054, 0.026), vec3(0.070, 0.030, 0.024), hue);
  vec3 cool = mix(vec3(0.026, 0.034, 0.066), vec3(0.034, 0.048, 0.030), hue);
  vec3 col = warm * glaze(a, 0.56) + cool * glaze(b, 0.6);
  col *= (0.6 + 0.5 * granulate) * (0.8 + 0.4 * paper);
  col += vec3(0.006, 0.0056, 0.005) * paper;
  col *= smoothstep(0.95, 0.2, length((uv - 0.5) * vec2(1.1, 1.3)));
  gl_FragColor = finish(col);
}`,
};

/* Renderer ----------------------------------------------------------------

   The renderer is one self-contained function. It normally runs in a worker
   that owns the canvas through transferControlToOffscreen, so drawing never
   touches the page's main thread (a canvas drawn on the main thread costs
   Chrome a layerize and commit every frame). Where OffscreenCanvas WebGL is
   missing, the same function runs on the main thread instead.

   Because the worker is built from this function's source text, it must not
   reference anything outside itself: no imports, no module constants. Its
   inputs arrive as messages. */

type RuntimeConfig = {
  vertex: string;
  common: string;
  scenes: Record<string, string>;
  /* Scenes in page order, for warming the shader programs. */
  order: string[];
  force: boolean;
  dev: boolean;
  fadeMs: number;
  frameMs: number;
  maxPixels: number;
  stillTime: number;
};

type InMessage =
  | { type: "init"; canvas: HTMLCanvasElement | OffscreenCanvas; config: RuntimeConfig }
  | { type: "size"; width: number; height: number; small: boolean }
  | { type: "scene"; id: string | null }
  | { type: "active"; on: boolean }
  | { type: "reduced"; on: boolean }
  | { type: "pointer"; x: number; y: number }
  | { type: "sections"; data: Record<string, [number, number]> }
  | { type: "stats" }
  | { type: "bench"; n: number }
  | { type: "dispose" };

type OutMessage =
  | { type: "ready" }
  | { type: "fail"; reason: string }
  | { type: "stats"; stats: Record<string, unknown> }
  | { type: "bench"; result: Record<string, unknown> | null };

function shaderRuntime(post: (message: OutMessage) => void) {
  type Program = {
    program: WebGLProgram;
    ready: boolean;
    failed: boolean;
    loc: Record<string, WebGLUniformLocation | null>;
  };
  const UNIFORMS = ["uRes", "uTime", "uFade", "uMotion", "uScale", "uPointer", "uProgress", "uScroll"];

  let config: RuntimeConfig;
  let canvas: HTMLCanvasElement | OffscreenCanvas;
  let gl: WebGLRenderingContext | null = null;
  let buffer: WebGLBuffer | null = null;
  let programs = new Map<string, Program>();
  let lost = false;
  let disabled = false;

  let cssWidth = 0;
  let cssHeight = 0;
  let small = false;
  let degrade = 1;
  let scale = 0.5;
  let width = 0;
  let height = 0;
  let sizeDirty = true;

  let target: string | null = null;
  const weights = new Map<string, number>();
  let sections: Record<string, [number, number]> = {};
  let active = false;
  let reduced = false;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  let frameHandle = 0;
  let timer = 0;
  let warmTimer = 0;
  let running = false;
  let lastFrame = 0;
  let slowSince = 0;
  const t0 = performance.now();
  const stats = {
    scene: null as string | null,
    scale,
    frames: 0,
    drawMsAvg: 0,
    drawMsMax: 0,
    intervalMsAvg: 33.3,
    running: false,
    layers: "",
    thread: typeof document === "undefined" ? "worker" : "main",
  };

  const hasRaf = typeof requestAnimationFrame === "function";
  const nextFrame = (callback: (now: number) => void) =>
    hasRaf
      ? requestAnimationFrame(callback)
      : (setTimeout(() => callback(performance.now()), 16) as unknown as number);
  const cancelFrame = (handle: number) => {
    if (hasRaf) cancelAnimationFrame(handle);
    else clearTimeout(handle);
  };
  const smooth = (x: number) => x * x * (3 - 2 * x);

  /* GL resources */

  const setup = () => {
    const g = gl!;
    const compile = (type: number, source: string) => {
      const shader = g.createShader(type)!;
      g.shaderSource(shader, source);
      g.compileShader(shader);
      return shader;
    };
    buffer = g.createBuffer();
    g.bindBuffer(g.ARRAY_BUFFER, buffer);
    // One triangle that covers the screen.
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    g.enableVertexAttribArray(0);
    g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
    g.blendFunc(g.ONE, g.ONE);
    // Issue every compile up front; the driver works on them in parallel and
    // status is only queried once a scene is needed (or while idle).
    const vertex = compile(g.VERTEX_SHADER, config.vertex);
    programs = new Map();
    config.order.forEach((id) => {
      const fragment = compile(g.FRAGMENT_SHADER, config.common + config.scenes[id]);
      const program = g.createProgram()!;
      g.attachShader(program, vertex);
      g.attachShader(program, fragment);
      g.bindAttribLocation(program, 0, "aPos");
      g.linkProgram(program);
      programs.set(id, { program, ready: false, failed: false, loc: {} });
    });
    sizeDirty = true;
    warm();
  };

  const getProgram = (id: string): Program | null => {
    const entry = programs.get(id);
    if (!entry || entry.failed || !gl) return null;
    if (!entry.ready) {
      const g = gl;
      if (!g.getProgramParameter(entry.program, g.LINK_STATUS)) {
        entry.failed = true;
        if (config.dev) {
          const shaders = g.getAttachedShaders(entry.program) ?? [];
          console.warn(
            `[SectionShaders] ${id} failed:`,
            g.getProgramInfoLog(entry.program),
            shaders.map((s) => g.getShaderInfoLog(s)).join("\n"),
          );
        }
        return null;
      }
      UNIFORMS.forEach((name) => {
        entry.loc[name] = g.getUniformLocation(entry.program, name);
      });
      entry.ready = true;
    }
    return entry;
  };

  // Finish linking one program at a time, between frames, so the first
  // scroll into a section never waits on the driver.
  const warm = () => {
    clearTimeout(warmTimer);
    const parallel = gl?.getExtension("KHR_parallel_shader_compile");
    const step = () => {
      if (!gl || lost) return;
      const pending = config.order.find((id) => !programs.get(id)?.ready && !programs.get(id)?.failed);
      if (!pending) return;
      const entry = programs.get(pending)!;
      if (!parallel || gl.getProgramParameter(entry.program, parallel.COMPLETION_STATUS_KHR))
        getProgram(pending);
      warmTimer = setTimeout(step, 120) as unknown as number;
    };
    warmTimer = setTimeout(step, 300) as unknown as number;
  };

  const resize = () => {
    const w0 = Math.max(1, cssWidth);
    const h0 = Math.max(1, cssHeight);
    const base = (small ? 0.4 : 0.5) * degrade;
    scale = Math.min(base, Math.sqrt(config.maxPixels / (w0 * h0)));
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));
    if (w !== width || h !== height) {
      width = canvas.width = w;
      height = canvas.height = h;
    }
    stats.scale = scale;
    sizeDirty = false;
  };

  /* Drawing */

  const draw = (time: number, motion: number) => {
    const g = gl;
    if (!g || lost) return;
    if (sizeDirty) resize();
    g.viewport(0, 0, width, height);
    g.clearColor(0, 0, 0, 1);
    g.clear(g.COLOR_BUFFER_BIT);
    g.enable(g.BLEND);
    weights.forEach((weight, id) => {
      if (weight <= 0.001) return;
      const entry = getProgram(id);
      if (!entry) return;
      const [progress, scroll] = sections[id] ?? [0.5, 0];
      const loc = entry.loc;
      // Bracket call: the dev refresh transform mistakes "use*" calls for hooks.
      g["useProgram"](entry.program);
      g.uniform2f(loc.uRes, width, height);
      g.uniform1f(loc.uTime, time);
      g.uniform1f(loc.uFade, smooth(weight));
      g.uniform1f(loc.uMotion, motion);
      g.uniform1f(loc.uScale, scale);
      g.uniform2f(loc.uPointer, pointer.x, pointer.y);
      g.uniform1f(loc.uProgress, progress);
      g.uniform1f(loc.uScroll, scroll);
      g.drawArrays(g.TRIANGLES, 0, 3);
    });
  };

  const canAnimate = () => !!gl && !disabled && !lost && active && !reduced;

  const stopLoop = () => {
    cancelFrame(frameHandle);
    clearTimeout(timer);
    frameHandle = 0;
    timer = 0;
    running = false;
    stats.running = false;
  };

  const fail = (reason: string) => {
    disabled = true;
    stopLoop();
    post({ type: "fail", reason });
  };

  const tick = (now: number) => {
    frameHandle = 0;
    if (!canAnimate()) {
      stopLoop();
      return;
    }
    // Sleep through the in-between vsyncs instead of waking for each one.
    timer = setTimeout(() => {
      timer = 0;
      frameHandle = nextFrame(tick);
    }, config.frameMs - 9) as unknown as number;
    const interval = lastFrame ? now - lastFrame : config.frameMs;
    const dt = Math.min(interval, 100);
    lastFrame = now;
    const start = performance.now();

    // Crossfade toward the target scene.
    const step = dt / config.fadeMs;
    if (target && !weights.has(target)) weights.set(target, 0);
    weights.forEach((weight, id) => {
      const next = id === target ? Math.min(1, weight + step) : Math.max(0, weight - step);
      if (next <= 0 && id !== target) weights.delete(id);
      else weights.set(id, next);
    });
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;

    draw(((now - t0) / 1000) % 3600, 1);

    const cost = performance.now() - start;
    stats.frames++;
    stats.drawMsAvg += (cost - stats.drawMsAvg) * 0.05;
    stats.drawMsMax = Math.max(stats.drawMsMax, cost);
    if (config.dev) stats.layers = [...weights].map(([id, w]) => `${id}:${w.toFixed(2)}`).join(" ");

    // Frames arriving far slower than asked for mean the GPU cannot keep up:
    // step the resolution down twice, then give up and show plain black.
    if (interval < 400) {
      stats.intervalMsAvg += (interval - stats.intervalMsAvg) * 0.05;
      if (!config.force && stats.intervalMsAvg > 75) {
        slowSince ||= now;
        if (now - slowSince > 3000) {
          slowSince = 0;
          stats.intervalMsAvg = config.frameMs;
          if (degrade > 0.5) {
            degrade *= 0.7;
            sizeDirty = true;
          } else {
            fail("too slow");
            return;
          }
        }
      } else slowSince = 0;
    }

    if (!target && weights.size === 0) {
      // Faded out on a section without a scene: stop until one returns.
      gl!.clearColor(0, 0, 0, 1);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      stopLoop();
    }
  };

  const renderStill = () => {
    if (!gl || disabled || lost || !active) return;
    weights.clear();
    if (target) weights.set(target, 1);
    pointer.x = pointer.y = 0;
    draw(config.stillTime, 0);
  };

  const kick = () => {
    stats.scene = target;
    if (!gl || disabled || lost) return;
    if (reduced) {
      renderStill();
      return;
    }
    if (canAnimate() && !running && (target || weights.size)) {
      running = true;
      stats.running = true;
      lastFrame = 0;
      frameHandle = nextFrame(tick);
    }
  };

  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    stopLoop();
  };
  const onRestored = () => {
    lost = false;
    setup();
    kick();
  };

  return (message: InMessage) => {
    switch (message.type) {
      case "init": {
        config = message.config;
        canvas = message.canvas;
        const attributes: WebGLContextAttributes = {
          alpha: false,
          antialias: false,
          depth: false,
          stencil: false,
          premultipliedAlpha: true,
          preserveDrawingBuffer: false,
          powerPreference: "low-power",
          // Software WebGL would cost more than this is worth; skip it.
          failIfMajorPerformanceCaveat: !config.force,
        };
        try {
          gl = canvas.getContext("webgl", attributes) as WebGLRenderingContext | null;
        } catch {
          gl = null;
        }
        if (!gl) {
          post({ type: "fail", reason: "no-context" });
          return;
        }
        canvas.addEventListener("webglcontextlost", onLost as EventListener);
        canvas.addEventListener("webglcontextrestored", onRestored as EventListener);
        setup();
        post({ type: "ready" });
        kick();
        return;
      }
      case "size":
        cssWidth = message.width;
        cssHeight = message.height;
        small = message.small;
        sizeDirty = true;
        if (reduced) renderStill();
        return;
      case "scene":
        target = message.id;
        kick();
        return;
      case "active":
        active = message.on;
        if (!active) stopLoop();
        kick();
        return;
      case "reduced":
        reduced = message.on;
        if (reduced) stopLoop();
        else weights.clear();
        kick();
        return;
      case "pointer":
        pointer.tx = message.x;
        pointer.ty = message.y;
        return;
      case "sections":
        sections = message.data;
        return;
      case "stats":
        post({ type: "stats", stats: { ...stats } });
        return;
      case "bench": {
        // Draws n frames and stalls on a one-pixel read after each, so the
        // result approximates the full per-frame GPU cost.
        if (!gl || !target) {
          post({ type: "bench", result: null });
          return;
        }
        const saved = new Map(weights);
        weights.clear();
        weights.set(target, 1);
        const pixel = new Uint8Array(4);
        const start = performance.now();
        for (let i = 0; i < message.n; i++) {
          draw(10 + i * 0.033, 1);
          gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        }
        const ms = (performance.now() - start) / message.n;
        weights.clear();
        saved.forEach((w, id) => weights.set(id, w));
        post({ type: "bench", result: { scene: target, ms, width, height } });
        return;
      }
      case "dispose":
        stopLoop();
        clearTimeout(warmTimer);
        gl?.getExtension("WEBGL_lose_context")?.loseContext();
        gl = null;
        return;
    }
  };
}

/* Page side ----------------------------------------------------------------- */

const hasIdle =
  typeof window !== "undefined" &&
  typeof (window as Partial<Window>).requestIdleCallback === "function";
const onIdle = (fn: () => void, timeout: number): number =>
  hasIdle ? window.requestIdleCallback(fn, { timeout }) : window.setTimeout(fn, Math.min(timeout, 900));
const cancelIdle = (handle: number) =>
  hasIdle ? window.cancelIdleCallback(handle) : window.clearTimeout(handle);

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function createWorker(): { worker: Worker; url: string } | null {
  try {
    const source =
      `const handle = (${shaderRuntime.toString()})((m) => self.postMessage(m));\n` +
      `self.onmessage = (event) => handle(event.data);`;
    const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
    return { worker: new Worker(url), url };
  } catch {
    return null;
  }
}

function createEngine(host: HTMLElement): () => void {
  const query = new URLSearchParams(window.location.search).get("shaders");
  const force = query === "force";
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (query === "off" || (connection?.saveData && !force)) return () => {};

  const config: RuntimeConfig = {
    vertex: VERTEX,
    common: COMMON,
    scenes: SCENES,
    order: SECTIONS.map(([, scene]) => scene).filter((scene): scene is SceneId => !!scene),
    force,
    dev: DEV,
    fadeMs: FADE_MS,
    frameMs: FRAME_MS,
    maxPixels: MAX_PIXELS,
    stillTime: STILL_TIME,
  };

  const small = window.matchMedia("(max-width: 760px), (pointer: coarse)");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");

  let canvas: HTMLCanvasElement | null = null;
  let worker: Worker | null = null;
  let send: (message: InMessage, transfer?: Transferable[]) => void = () => {};
  let dead = false;
  let triedWorker = false;
  const waiting = { stats: [] as ((v: unknown) => void)[], bench: [] as ((v: unknown) => void)[] };

  const teardownRenderer = () => {
    send({ type: "dispose" });
    worker?.terminate();
    worker = null;
    canvas?.remove();
    canvas = null;
    send = () => {};
  };

  const onMessage = (message: OutMessage) => {
    if (message.type === "fail") {
      const fromWorker = !!worker;
      teardownRenderer();
      // A worker without WebGL can still mean the main thread has it.
      if (fromWorker && message.reason === "no-context") start(false);
      else {
        dead = true;
        host.classList.add("is-off");
      }
    } else if (message.type === "stats") waiting.stats.shift()?.(message.stats);
    else if (message.type === "bench") waiting.bench.shift()?.(message.result);
  };

  /* Page state the renderer needs */

  const sceneElements = new Map<SceneId, Element>();
  const elementScene = new Map<Element, SceneId | null>();
  const geometry = new Map<SceneId, { top: number; height: number }>();
  let target: SceneId | null = null;

  const measure = () => {
    sceneElements.forEach((element, id) => {
      const rect = element.getBoundingClientRect();
      geometry.set(id, { top: rect.top + window.scrollY, height: rect.height });
    });
    postSections();
  };

  let lastSections = 0;
  let sectionsTimer = 0;
  const postSections = () => {
    if (dead) return;
    const now = performance.now();
    if (now - lastSections < 30) {
      sectionsTimer ||= window.setTimeout(() => {
        sectionsTimer = 0;
        postSections();
      }, 32);
      return;
    }
    lastSections = now;
    const vh = window.innerHeight;
    const y = window.scrollY;
    const data: Record<string, [number, number]> = {};
    geometry.forEach(({ top, height }, id) => {
      const viewTop = top - y;
      data[id] = [clamp01((vh - viewTop) / (vh + height)), -viewTop * 0.22];
    });
    send({ type: "sections", data });
  };

  const isActive = () =>
    document.documentElement.dataset.theme !== "light" && document.visibilityState === "visible";

  const postSize = () =>
    send({
      type: "size",
      width: host.clientWidth || window.innerWidth,
      height: host.clientHeight || window.innerHeight,
      small: small.matches,
    });

  const sync = () => {
    postSize();
    send({ type: "reduced", on: reduced.matches });
    send({ type: "active", on: isActive() });
    postSections();
    send({ type: "scene", id: target });
  };

  const start = (useWorker: boolean) => {
    canvas = document.createElement("canvas");
    host.appendChild(canvas);
    if (useWorker && !triedWorker && "transferControlToOffscreen" in canvas) {
      triedWorker = true;
      const made = createWorker();
      if (made) {
        try {
          const offscreen = canvas.transferControlToOffscreen();
          worker = made.worker;
          worker.onmessage = (event: MessageEvent<OutMessage>) => {
            if (event.data.type === "ready") URL.revokeObjectURL(made.url);
            onMessage(event.data);
          };
          worker.onerror = () => {
            URL.revokeObjectURL(made.url);
            onMessage({ type: "fail", reason: "worker-error" });
          };
          const port = worker;
          send = (message, transfer) => port.postMessage(message, transfer ?? []);
          send({ type: "init", canvas: offscreen, config }, [offscreen]);
          sync();
          return;
        } catch {
          made.worker.terminate();
          URL.revokeObjectURL(made.url);
          worker = null;
          // The canvas may already belong to an OffscreenCanvas; use a new one.
          canvas.remove();
          canvas = document.createElement("canvas");
          host.appendChild(canvas);
        }
      }
    }
    const handle = shaderRuntime(onMessage);
    send = (message) => handle(message);
    send({ type: "init", canvas, config });
    if (!dead && canvas) sync();
  };

  /* Which section holds the middle of the viewport */

  const inBand = new Map<Element, number>();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) inBand.set(entry.target, entry.intersectionRect.height);
        else inBand.delete(entry.target);
      });
      let best: Element | null = null;
      let bestHeight = -1;
      inBand.forEach((h, element) => {
        if (h > bestHeight) {
          best = element;
          bestHeight = h;
        }
      });
      // In the gaps between sections the last scene holds.
      if (!best) return;
      const scene = elementScene.get(best) ?? null;
      if (scene !== target) {
        target = scene;
        send({ type: "scene", id: target });
      }
    },
    { rootMargin: "-42% 0px -42% 0px" },
  );
  const resizeObserver = new ResizeObserver(() => measure());
  SECTIONS.forEach(([selector, scene]) => {
    document.querySelectorAll(selector).forEach((element) => {
      elementScene.set(element, scene);
      if (scene && !sceneElements.has(scene)) {
        sceneElements.set(scene, element);
        resizeObserver.observe(element);
      }
      observer.observe(element);
    });
  });

  /* Events */

  const onResize = () => {
    postSize();
    measure();
  };
  const onScroll = () => postSections();
  const onActive = () => send({ type: "active", on: isActive() });
  const onReduced = () => send({ type: "reduced", on: reduced.matches });
  let lastPointer = 0;
  const onPointer = (event: PointerEvent) => {
    if (!finePointer.matches) return;
    const now = performance.now();
    if (now - lastPointer < 40) return;
    lastPointer = now;
    send({
      type: "pointer",
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: 1 - (event.clientY / window.innerHeight) * 2,
    });
  };
  const themeObserver = new MutationObserver(onActive);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("visibilitychange", onActive);
  reduced.addEventListener("change", onReduced);

  start(true);
  measure();

  if (DEV) {
    // Dev-only probe for perf checks.
    (window as unknown as Record<string, unknown>).__sectionShaders = {
      stats: () => new Promise((resolve) => {
        waiting.stats.push(resolve);
        send({ type: "stats" });
      }),
      bench: (n = 30) => new Promise((resolve) => {
        waiting.bench.push(resolve);
        send({ type: "bench", n });
      }),
    };
  }

  return () => {
    teardownRenderer();
    dead = true;
    window.clearTimeout(sectionsTimer);
    observer.disconnect();
    resizeObserver.disconnect();
    themeObserver.disconnect();
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("pointermove", onPointer);
    document.removeEventListener("visibilitychange", onActive);
    reduced.removeEventListener("change", onReduced);
  };
}

export default function SectionShaders() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    // Start once the page has painted and the main thread is quiet.
    const handle = onIdle(() => {
      if (!cancelled) cleanup = createEngine(host);
    }, 2500);
    return () => {
      cancelled = true;
      cancelIdle(handle);
      cleanup?.();
    };
  }, []);

  return <div ref={hostRef} className="section-shaders" aria-hidden="true" />;
}
