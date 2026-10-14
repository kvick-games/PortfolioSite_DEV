import { useEffect, useRef, useState } from "react";
import { generateLevel, type LevelMap } from "./levelGenMap";

/**
 * The Level Generator panel: the generator's nine steps as a night-time
 * blueprint, building one new level after another. Points, triangulation and
 * pruning give way to rooms, doors and walls; slots are set out and pruned;
 * then the props come on like lamps. Each level holds, fades, and the next
 * begins from fresh points. Everything fades; nothing moves.
 */

/** The virtual frame, cover-fitted into the panel like its still. */
export const FRAME_W = 1200;
export const FRAME_H = 1000;
const COLS = 40;
const ROWS = 33;
const CELL = 30;
const OY = (FRAME_H - ROWS * CELL) / 2;
const POINTS = 20;
const LOOPS = 3;
/** The first level, which is also the panel's still. */
export const FIRST_SEED = 4817;

/** How long each step plays, in ms, then the hold and the fade to the next level. */
const STEP_MS = [1300, 1400, 1300, 1700, 1200, 1400, 1200, 1200, 1500];
const HOLD_MS = 3200;
const FADE_MS = 1300;
/** S[1..9]: when each step starts within a level's cycle. */
const S = [0];
for (let i = 0, at = 0; i < STEP_MS.length; at += STEP_MS[i++]) S.push(at);
const BUILD_END = S[9] + STEP_MS[8];
const CYCLE = BUILD_END + HOLD_MS + FADE_MS;

const INK = "233,228,218";
const COOL = "143,166,187";
const EMBER = "242,72,27";
const LAMP = "255,170,96";

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (v: number) => 1 - (1 - v) * (1 - v);
/** 0 → 1 over `dur` from `start`. */
const fin = (t: number, start: number, dur = 450) => ease(clamp((t - start) / dur));
/** 1 → 0 over `dur` from `start`. */
const fout = (t: number, start: number, dur = 550) => 1 - clamp((t - start) / dur);
const mix = (a: number, b: number, k: number) => a + (b - a) * k;

interface Scene {
  map: LevelMap;
  rank: Map<string, number>;
  sweep: (x: number, y: number) => number;
  growth: number[];
  doors: Path2D[];
  rooms: Path2D[];
}

function buildScene(seed: number): Scene {
  const map = generateLevel(seed, COLS, ROWS, 0, { points: POINTS, loops: LOOPS });
  const order = map.edges
    .map((e) => ({ key: e.key, x: map.points[e.a].x + map.points[e.b].x }))
    .sort((a, b) => a.x - b.x);
  const rank = new Map(order.map((e, i) => [e.key, i / Math.max(order.length - 1, 1)]));
  const shown = Math.min(map.growthRounds, 7);
  const growth = Array.from({ length: shown }, (_, k) => Math.round(((k + 1) * map.growthRounds) / shown) - 1);
  // Paths in cell units, placed in the frame.
  const toFrame = new DOMMatrix([CELL, 0, 0, CELL, 0, OY]);
  const place = (cells: Path2D) => {
    const p = new Path2D();
    p.addPath(cells, toFrame);
    return p;
  };
  const poly = (points: Array<[number, number]>) => {
    const p = new Path2D();
    points.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
    p.closePath();
    return place(p);
  };
  return {
    map,
    rank,
    sweep: (x, y) => (x + y * 0.35) / (COLS + ROWS * 0.35),
    growth,
    doors: map.doors.map((d) => place(new Path2D(d.d))),
    rooms: map.rooms.map((r) => poly(r.poly)),
  };
}

/** Floor hatching per theme: planks, tiles, diagonal boards. */
function themePatterns(ctx: CanvasRenderingContext2D) {
  const make = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
    const tile = document.createElement("canvas");
    tile.width = w;
    tile.height = h;
    const c = tile.getContext("2d")!;
    c.strokeStyle = `rgba(${INK},1)`;
    c.lineWidth = 1;
    draw(c);
    return ctx.createPattern(tile, "repeat")!;
  };
  return [
    make(30, 8, (c) => {
      c.beginPath();
      c.moveTo(0, 7.5);
      c.lineTo(30, 7.5);
      c.moveTo(9.5, 0);
      c.lineTo(9.5, 7.5);
      c.stroke();
    }),
    make(15, 15, (c) => {
      c.beginPath();
      c.moveTo(0, 0.5);
      c.lineTo(15, 0.5);
      c.moveTo(0.5, 0);
      c.lineTo(0.5, 15);
      c.stroke();
    }),
    make(10, 10, (c) => {
      c.beginPath();
      c.moveTo(0, 10);
      c.lineTo(10, 0);
      c.moveTo(-5, 5);
      c.lineTo(5, -5);
      c.moveTo(5, 15);
      c.lineTo(15, 5);
      c.stroke();
    }),
  ];
}

type Patterns = ReturnType<typeof themePatterns>;

/** A soft line: a wide faint stroke under a fine bright one. */
function glowStroke(ctx: CanvasRenderingContext2D, path: Path2D, rgb: string, width: number, alpha: number) {
  if (alpha <= 0.002) return;
  ctx.strokeStyle = `rgba(${rgb},${alpha * 0.09})`;
  ctx.lineWidth = width * 5;
  ctx.stroke(path);
  ctx.strokeStyle = `rgba(${rgb},${alpha * 0.22})`;
  ctx.lineWidth = width * 2.2;
  ctx.stroke(path);
  ctx.strokeStyle = `rgba(${rgb},${alpha})`;
  ctx.lineWidth = width;
  ctx.stroke(path);
}

const line = (x1: number, y1: number, x2: number, y2: number) => {
  const p = new Path2D();
  p.moveTo(x1, y1);
  p.lineTo(x2, y2);
  return p;
};
const px = (v: number) => v * CELL;
const py = (v: number) => v * CELL + OY;

/** Draws one moment of a level's cycle into the frame (FRAME_W x FRAME_H units). */
export function drawScene(ctx: CanvasRenderingContext2D, scene: Scene, t: number, patterns: Patterns) {
  const { map, sweep, rank } = scene;
  const all = t > BUILD_END + HOLD_MS ? fout(t, BUILD_END + HOLD_MS, FADE_MS) : 1;

  // Ground: a dark sheet, a vignette, a faint grid of cell corners.
  ctx.fillStyle = "#0a0c0f";
  ctx.fillRect(0, 0, FRAME_W, FRAME_H);
  const glow = ctx.createRadialGradient(FRAME_W / 2, FRAME_H * 0.45, 60, FRAME_W / 2, FRAME_H * 0.5, FRAME_W * 0.75);
  glow.addColorStop(0, "rgba(40,50,62,0.55)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, FRAME_W, FRAME_H);
  ctx.fillStyle = `rgba(${COOL},0.13)`;
  for (let y = 0; y <= ROWS; y += 2) for (let x = 0; x <= COLS; x += 2) ctx.fillRect(px(x) - 1, py(y) - 1, 2, 2);
  if (all <= 0) return;
  ctx.globalAlpha = all;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // 5 + 6: hall floors, then themed room floors.
  for (const c of map.halls) {
    const a = fin(t, S[5] + sweep(c.x, c.y) * 600);
    if (a <= 0) continue;
    ctx.fillStyle = `rgba(${COOL},${0.1 * a})`;
    ctx.fillRect(px(c.x), py(c.y), CELL, CELL);
  }
  map.rooms.forEach((room, i) => {
    const a = fin(t, S[6] + i * 40, 600);
    if (a <= 0) return;
    ctx.fillStyle = `rgba(${INK},${0.035 * a})`;
    ctx.fill(scene.rooms[i]);
    ctx.globalAlpha = all * a * 0.16;
    ctx.fillStyle = patterns[room.theme % patterns.length];
    ctx.fill(scene.rooms[i]);
    ctx.globalAlpha = all;
  });

  // 4: rooms grow from their points, one round at a time.
  const g = 1250 / Math.max(scene.growth.length, 1);
  if (t >= S[4] && t < S[7]) {
    scene.growth.forEach((round, k) => {
      const last = k === scene.growth.length - 1;
      const start = S[4] + k * g;
      const a = last
        ? fin(t, start, 400) * fout(t, S[6], 700)
        : fin(t, start, g * 0.9) * fout(t, start + g * 1.1, g * 1.1);
      if (a <= 0.002) return;
      for (const room of map.rooms) {
        const r = room.growth[round];
        const rect = new Path2D();
        rect.rect(px(r.x), py(r.y), px(r.w), r.h * CELL);
        if (last) {
          ctx.fillStyle = `rgba(${COOL},${0.08 * a})`;
          ctx.fill(rect);
        }
        glowStroke(ctx, rect, last ? INK : COOL, last ? 1.6 : 1, (last ? 0.75 : 0.5) * a);
      }
    });
  }

  // 2 + 3: the triangulation; pruning burns away the edges it doesn't keep.
  if (t >= S[2] && t < S[6] + 700) {
    for (const e of map.edges) {
      const r = rank.get(e.key) ?? 0;
      let a = fin(t, S[2] + r * 1000, 500);
      const p = map.points[e.a];
      const q = map.points[e.b];
      const path = line(px(p.x + 0.5), py(p.y + 0.5), px(q.x + 0.5), py(q.y + 0.5));
      if (!e.kept) {
        const burn = fin(t, S[3], 300);
        a *= fout(t, S[3] + 250 + r * 700, 600);
        if (a <= 0.002) continue;
        glowStroke(ctx, path, burn > 0 ? EMBER : COOL, 1.1, a * mix(0.55, 0.9, burn));
        continue;
      }
      const keep = fin(t, S[3], 500);
      a *= mix(1, 0.45, fin(t, S[4], 600)) * fout(t, S[6], 700);
      if (a <= 0.002) continue;
      if (!e.mst && keep > 0) ctx.setLineDash([9, 7]);
      glowStroke(ctx, path, keep > 0 ? INK : COOL, mix(1.1, 2, keep), a * mix(0.55, 0.95, keep));
      ctx.setLineDash([]);
    }
  }

  // 6: walls and doors.
  for (const w of map.walls) {
    const a = fin(t, S[6] + 150 + sweep(Math.min(w.x1, w.x2), Math.min(w.y1, w.y2)) * 600, 500);
    if (a <= 0) continue;
    glowStroke(ctx, line(px(w.x1), py(w.y1), px(w.x2), py(w.y2)), INK, 3.2, 0.92 * a);
  }
  map.doors.forEach((d, i) => {
    const a = fin(t, S[6] + 650 + sweep(d.x, d.y) * 400, 500);
    if (a <= 0) return;
    ctx.strokeStyle = `rgba(${INK},${0.55 * a})`;
    ctx.lineWidth = 1.2;
    ctx.stroke(scene.doors[i]);
  });

  // 5: an ember where each route crosses a wall.
  if (t >= S[5] && t < S[6] + 1200) {
    for (const d of map.doors) {
      const a = fin(t, S[5] + 300 + sweep(d.x, d.y) * 600, 400) * fout(t, S[6] + 500, 700);
      if (a <= 0.002) continue;
      const path = d.vertical
        ? line(px(d.x), py(d.y + 0.15), px(d.x), py(d.y + 0.85))
        : line(px(d.x + 0.15), py(d.y), px(d.x + 0.85), py(d.y));
      glowStroke(ctx, path, EMBER, 4, a);
    }
  }

  // 7 + 8: every possible slot, then the ones pruning keeps.
  if (t >= S[7]) {
    for (const s of map.slots) {
      let a = fin(t, S[7] + sweep(s.x, s.y) * 900, 400);
      let rgb = COOL;
      if (!s.kept) {
        if (t >= S[8]) rgb = EMBER;
        a *= fout(t, S[8] + 200 + sweep(s.x, s.y) * 700, 500);
      } else {
        a *= mix(1, 0.35, fin(t, S[9], 700));
      }
      if (a <= 0.002) continue;
      const x = px(s.x);
      const y = py(s.y);
      ctx.fillStyle = `rgba(${rgb},${0.55 * a})`;
      if (s.kind === "floor") ctx.fillRect(x + 12, y + 12, 6, 6);
      else if (s.side === "n") ctx.fillRect(x + 6, y + 5, 18, 5);
      else if (s.side === "s") ctx.fillRect(x + 6, y + 20, 18, 5);
      else if (s.side === "w") ctx.fillRect(x + 5, y + 6, 5, 18);
      else ctx.fillRect(x + 20, y + 6, 5, 18);
    }
  }

  // 9: props, each lighting a pool of warm light around it.
  if (t >= S[9]) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of map.props) {
      const a = fin(t, S[9] + 150 + sweep(p.x, p.y) * 1000, 1100);
      if (a <= 0) continue;
      const cx = px(p.x + p.w / 2);
      const cy = py(p.y + p.h / 2);
      const radius = CELL * (p.round ? 2.8 : 1.8);
      const pool = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      pool.addColorStop(0, `rgba(${LAMP},${(p.round ? 0.34 : 0.18) * a * all})`);
      pool.addColorStop(1, `rgba(${LAMP},0)`);
      ctx.fillStyle = pool;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    }
    ctx.restore();
    for (const p of map.props) {
      const a = fin(t, S[9] + sweep(p.x, p.y) * 1000, 500);
      if (a <= 0) continue;
      ctx.fillStyle = `rgba(20,17,14,${a})`;
      ctx.strokeStyle = `rgba(${p.round ? LAMP : INK},${0.9 * a})`;
      ctx.lineWidth = 1.6;
      const shape = new Path2D();
      if (p.round) shape.arc(px(p.x + 0.5), py(p.y + 0.5), 8, 0, Math.PI * 2);
      else shape.rect(px(p.x) + 6, py(p.y) + 6, px(p.w) - 12, p.h * CELL - 12);
      ctx.fill(shape);
      ctx.stroke(shape);
    }
  }

  // 1: the points every room grows from.
  if (t < S[6] + 700) {
    map.points.forEach((p, i) => {
      const a =
        fin(t, S[1] + (i * 1000) / map.points.length, 400) *
        mix(1, 0.5, fin(t, S[4], 600)) *
        fout(t, S[6], 700);
      if (a <= 0.002) return;
      const cx = px(p.x + 0.5);
      const cy = py(p.y + 0.5);
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
      halo.addColorStop(0, `rgba(${LAMP},${0.45 * a})`);
      halo.addColorStop(1, `rgba(${LAMP},0)`);
      ctx.fillStyle = halo;
      ctx.fillRect(cx - 22, cy - 22, 44, 44);
      ctx.fillStyle = `rgba(255,244,230,${a})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.globalAlpha = 1;
}

/** The panel's still: the first level, finished. */
export function drawStill(canvas: HTMLCanvasElement, seed = FIRST_SEED) {
  canvas.width = FRAME_W;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext("2d")!;
  drawScene(ctx, buildScene(seed), BUILD_END + 100, themePatterns(ctx));
}

/**
 * Plays while its panel is open and on screen, and rests on its current
 * frame otherwise. It opens on the first level finished, which is the
 * panel's still, so fading in over the still shows no seam. Reduced motion
 * keeps the still.
 */
export default function SplashLevelGen({ playing, load }: { playing: boolean; load: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [still] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  const playingRef = useRef(playing);
  const kick = useRef<() => void>(() => undefined);

  useEffect(() => {
    playingRef.current = playing;
    kick.current();
  }, [playing]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || still || !load) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const patterns = themePatterns(ctx);
    let scene = buildScene(FIRST_SEED);
    let seedRng = FIRST_SEED;
    const nextSeed = () => {
      seedRng = (Math.imul(seedRng ^ (seedRng >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
      return 1000 + (seedRng % 99000);
    };
    // Open on the finished first level.
    let t = BUILD_END + 100;

    let width = 0;
    let height = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      draw();
    };
    const draw = () => {
      if (!width || !height) return;
      // Cover-fit the frame, centred, like the still behind it.
      const scale = Math.max(canvas.width / FRAME_W, canvas.height / FRAME_H);
      ctx.setTransform(scale, 0, 0, scale, (canvas.width - FRAME_W * scale) / 2, (canvas.height - FRAME_H * scale) / 2);
      drawScene(ctx, scene, t, patterns);
    };
    const sizes = new ResizeObserver(resize);
    sizes.observe(canvas);
    resize();
    setReady(true);

    let visible = false;
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      kick.current();
    });
    seen.observe(canvas);

    let frame = 0;
    let last = 0;
    let drawnAt = 0;
    const running = () => playingRef.current && visible && !document.hidden;
    const step = (now: number) => {
      frame = 0;
      const dt = last ? Math.min(now - last, 50) : 0;
      last = now;
      t += dt;
      if (t >= CYCLE) {
        t -= CYCLE;
        scene = buildScene(nextSeed());
      }
      // About 30 frames a second is plenty for fades.
      if (now - drawnAt > 30) {
        drawnAt = now;
        draw();
      }
      if (running()) frame = requestAnimationFrame(step);
      else last = 0;
    };
    kick.current = () => {
      if (!frame && running()) frame = requestAnimationFrame(step);
    };
    const onVisibility = () => kick.current();
    document.addEventListener("visibilitychange", onVisibility);
    kick.current();

    return () => {
      cancelAnimationFrame(frame);
      kick.current = () => undefined;
      sizes.disconnect();
      seen.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [still, load]);

  if (still || !load) return null;
  return (
    <canvas
      ref={ref}
      className={ready ? "splash-atmosphere is-ready" : "splash-atmosphere"}
      aria-hidden="true"
    />
  );
}
