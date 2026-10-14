// A small, deterministic level-generator sketch for the portfolio page,
// NOT the Unreal Engine 5 generator. Its nine stages are random points,
// Delaunay triangulation, edge pruning, room expansion, doors and halls,
// mesh generation, all candidate slots, slot pruning, and prop instantiation.

export interface Rect { x: number; y: number; w: number; h: number }
export interface Point { id: number; x: number; y: number; objective: boolean }
export interface Edge { key: string; a: number; b: number; length: number; mst: boolean; kept: boolean }
export interface Room {
  key: string;
  id: number;
  rect: Rect;
  poly: Array<[number, number]>;
  ax: number;
  ay: number;
  theme: number;
  objective: boolean;
  growth: Rect[];
}
export interface Segment { key: string; x1: number; y1: number; x2: number; y2: number }
export interface Door {
  key: string;
  // SVG path in cell units: the door leaf, then its swing.
  d: string;
  x: number;
  y: number;
  vertical: boolean;
  rooms: number[];
}
export interface Cell { key: string; x: number; y: number; room: number }
export type SlotKind = "wall" | "floor";
export type PruneReason = "door" | "lane" | "spacing" | "objective";
export interface Slot {
  key: string;
  room: number;
  x: number;
  y: number;
  kind: SlotKind;
  side?: "n" | "s" | "e" | "w";
  kept: boolean;
  reason?: PruneReason;
}
export interface Prop {
  key: string;
  room: number;
  x: number;
  y: number;
  w: number;
  h: number;
  round: boolean;
  slots: string[];
}
export interface LevelMap {
  cols: number;
  rows: number;
  points: Point[];
  triangles: Array<[number, number, number]>;
  edges: Edge[];
  rooms: Room[];
  growthRounds: number;
  halls: Cell[];
  cells: Cell[];
  walls: Segment[];
  doors: Door[];
  slots: Slot[];
  props: Prop[];
}

const EMPTY = -1;
const CORRIDOR = -2;

export const THEME_COUNT = 3;
// How often each theme resolves a one-cell slot into a round prop.
const ROUND_CHANCE = [0.12, 0.65, 0.35];

function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;
const intRng = (r: Rng, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));

// Local choices do not consume another room's random stream.
function hash(seed: number, a: number, b = 0): number {
  let h = (seed ^ Math.imul(a + 1, 0x9e3779b1) ^ Math.imul(b + 1, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Clockwise outline of a simply connected set of cells. */
function outline(cells: Set<number>, cols: number): Array<[number, number]> {
  const next = new Map<string, [number, number]>();
  const add = (x1: number, y1: number, x2: number, y2: number) =>
    next.set(`${x1},${y1}`, [x2, y2]);
  for (const i of cells) {
    const x = i % cols;
    const y = Math.floor(i / cols);
    if (!cells.has(i - cols)) add(x, y, x + 1, y);
    if (x === cols - 1 || !cells.has(i + 1)) add(x + 1, y, x + 1, y + 1);
    if (!cells.has(i + cols)) add(x + 1, y + 1, x, y + 1);
    if (x === 0 || !cells.has(i - 1)) add(x, y + 1, x, y);
  }
  const first = next.keys().next().value;
  if (!first) return [];
  const points: Array<[number, number]> = [];
  let key = first;
  for (let guard = 0; guard < 4096; guard++) {
    const [x, y] = key.split(",").map(Number) as [number, number];
    points.push([x, y]);
    const to = next.get(key);
    if (!to) break;
    key = `${to[0]},${to[1]}`;
    if (key === first) break;
  }
  // Drop collinear points.
  return points.filter((p, i) => {
    const a = points[(i - 1 + points.length) % points.length];
    const b = points[(i + 1) % points.length];
    return !((a[0] === p[0] && p[0] === b[0]) || (a[1] === p[1] && p[1] === b[1]));
  });
}

type Triangle = [number, number, number];

// Bowyer-Watson; insertion order resolves points on a shared circumcircle.
function triangulate(points: Point[], cols: number, rows: number): Triangle[] {
  if (points.length < 3) return [];
  const vertices = points.map(({ x, y }) => ({ x: x + 0.5, y: y + 0.5 }));
  const n = vertices.length;
  const span = Math.max(cols, rows, 1) * 10000;
  const cx = cols / 2;
  const cy = rows / 2;
  vertices.push(
    { x: cx - 2 * span, y: cy - span },
    { x: cx + 2 * span, y: cy - span },
    { x: cx, y: cy + 2 * span },
  );
  const orient = (a: number, b: number, c: number) =>
    (vertices[b].x - vertices[a].x) * (vertices[c].y - vertices[a].y) -
    (vertices[b].y - vertices[a].y) * (vertices[c].x - vertices[a].x);
  const inCircle = ([a, b, c]: Triangle, p: number) => {
    const ax = vertices[a].x - vertices[p].x;
    const ay = vertices[a].y - vertices[p].y;
    const bx = vertices[b].x - vertices[p].x;
    const by = vertices[b].y - vertices[p].y;
    const dx = vertices[c].x - vertices[p].x;
    const dy = vertices[c].y - vertices[p].y;
    const u = (ax * ax + ay * ay) * (bx * dy - by * dx);
    const v = (bx * bx + by * by) * (ax * dy - ay * dx);
    const w = (dx * dx + dy * dy) * (ax * by - ay * bx);
    const epsilon = 1e-12 * Math.max(1, Math.abs(u) + Math.abs(v) + Math.abs(w));
    return u - v + w >= -epsilon;
  };
  let triangles: Triangle[] = [[n, n + 1, n + 2]];
  for (let p = 0; p < n; p++) {
    const boundary = new Map<string, { a: number; b: number; count: number }>();
    const survivors: Triangle[] = [];
    for (const t of triangles) {
      if (!inCircle(t, p)) {
        survivors.push(t);
        continue;
      }
      for (const [a, b] of [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]]) {
        const key = `${Math.min(a, b)},${Math.max(a, b)}`;
        const edge = boundary.get(key);
        if (edge) edge.count++;
        else boundary.set(key, { a, b, count: 1 });
      }
    }
    for (const { a, b, count } of boundary.values()) {
      if (count !== 1) continue;
      const area = orient(a, b, p);
      if (Math.abs(area) <= 1e-9) continue;
      survivors.push(area > 0 ? [a, b, p] : [b, a, p]);
    }
    triangles = survivors;
  }
  return triangles
    .filter((t) => t.every((v) => v < n))
    .map((t): Triangle => {
      // Rotate without changing winding, then sort for stable stage data.
      const at = t.indexOf(Math.min(...t));
      return [t[at], t[(at + 1) % 3], t[(at + 2) % 3]];
    })
    .sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
}

const byLength = (a: Edge, b: Edge) => a.length - b.length || a.a - b.a || a.b - b.b;
const neighbours = (i: number, cols: number) => [i - cols, i + cols, i - 1, i + 1];
const space = (owner: number) => owner >= 0 ? owner : CORRIDOR;

// Dijkstra with a small min-heap; equal costs visit the lower cell index first.
function route(owner: Int16Array, cols: number, rows: number, a: Room, b: Room): number[] {
  const start = a.ay * cols + a.ax;
  const end = b.ay * cols + b.ax;
  const distance = new Float64Array(owner.length).fill(Infinity);
  const previous = new Int32Array(owner.length).fill(-1);
  type Entry = [number, number];
  const heap: Entry[] = [];
  const before = (a: Entry, b: Entry) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
  const push = (entry: Entry) => {
    let at = heap.length;
    heap.push(entry);
    while (at > 0) {
      const parent = (at - 1) >> 1;
      if (!before(entry, heap[parent])) break;
      heap[at] = heap[parent];
      at = parent;
    }
    heap[at] = entry;
  };
  const pop = (): Entry => {
    const first = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      let at = 0;
      while (at * 2 + 1 < heap.length) {
        let child = at * 2 + 1;
        if (child + 1 < heap.length && before(heap[child + 1], heap[child])) child++;
        if (!before(heap[child], last)) break;
        heap[at] = heap[child];
        at = child;
      }
      heap[at] = last;
    }
    return first;
  };
  distance[start] = 0;
  push([0, start]);
  while (heap.length) {
    const [cost, cell] = pop();
    if (cost !== distance[cell]) continue;
    if (cell === end) break;
    for (const next of neighbours(cell, cols)) {
      const x = next % cols;
      const y = Math.floor(next / cols);
      if (x <= 0 || x >= cols - 1 || y <= 0 || y >= rows - 1) continue;
      const o = owner[next];
      const entry = o === a.id || o === b.id || o === CORRIDOR ? 1 : o === EMPTY ? 3 : 14;
      const total = cost + entry + (space(owner[cell]) === space(o) ? 0 : 5);
      if (total >= distance[next]) continue;
      distance[next] = total;
      previous[next] = cell;
      push([total, next]);
    }
  }
  if (!Number.isFinite(distance[end])) return [];
  const path: number[] = [];
  for (let cell = end; cell !== -1; cell = previous[cell]) path.push(cell);
  return path.reverse();
}

export function generateLevel(
  seed: number,
  cols: number,
  rows: number,
  objectives: number,
  /** Overrides for larger canvases: how many seed points, how many loops. */
  options: { points?: number; loops?: number } = {},
): LevelMap {
  const rng = mulberry32(seed);
  const int = (lo: number, hi: number) => intRng(rng, lo, hi);
  const compact = cols < 32;
  const owner = new Int16Array(cols * rows).fill(EMPTY);

  // 1. Integer seed cells, spread out by rejection sampling.
  const points: Point[] = [];
  const target = options.points ?? (compact ? 8 : 13);
  const separation = compact ? 5 : 6;
  for (let attempt = 0; attempt < 3000 && points.length < target; attempt++) {
    if (cols < 5 || rows < 5) break;
    const x = int(2, cols - 3);
    const y = int(2, rows - 3);
    if (points.some((p) => Math.hypot(p.x - x, p.y - y) < separation)) continue;
    points.push({ id: points.length, x, y, objective: false });
  }

  // Objectives add the most isolated available seed cell, before triangulation.
  let fallback = 0;
  const objectiveCount = Math.max(0, Math.floor(objectives) || 0);
  for (let k = 0; k < objectiveCount; k++) {
    const r = mulberry32(seed + 7919 * (k + 1));
    let best = -1, ties = 0, bx = 2, by = 2;
    for (let y = 2; y <= rows - 3; y++) {
      for (let x = 2; x <= cols - 3; x++) {
        const distance = Math.min(...points.map((p) => (p.x - x) ** 2 + (p.y - y) ** 2));
        if (distance > best) { best = distance; ties = 1; bx = x; by = y; }
        else if (distance === best && r() < 1 / ++ties) { bx = x; by = y; }
      }
    }
    if (best < (compact ? 3.5 : 4) ** 2) { fallback = objectiveCount - k; break; }
    points.push({ id: points.length, x: bx, y: by, objective: true });
  }

  // 2. Every unique edge of the triangulation.
  const triangles = triangulate(points, cols, rows);
  const edgeMap = new Map<string, Edge>();
  const addEdge = (u: number, v: number) => {
    const a = Math.min(u, v);
    const b = Math.max(u, v);
    edgeMap.set(`${a},${b}`, {
      key: `e${a}-${b}`, a, b,
      length: Math.hypot(points[a].x - points[b].x, points[a].y - points[b].y),
      mst: false,
      kept: false,
    });
  };
  for (const [a, b, c] of triangles) {
    addEdge(a, b);
    addEdge(b, c);
    addEdge(c, a);
  }
  if (!triangles.length) {
    // A collinear point set has a one-dimensional Delaunay chain.
    const line = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
    for (let i = 1; i < line.length; i++) addEdge(line[i - 1].id, line[i].id);
  }
  const edges = [...edgeMap.values()].sort((a, b) => a.a - b.a || a.b - b.b);

  // 3. Kruskal's tree, followed by a small number of short loops.
  const parent = points.map((p) => p.id);
  const root = (id: number): number => {
    while (parent[id] !== id) {
      parent[id] = parent[parent[id]];
      id = parent[id];
    }
    return id;
  };
  const ordered = [...edges].sort(byLength);
  let longest = 0;
  for (const edge of ordered) {
    const a = root(edge.a);
    const b = root(edge.b);
    if (a === b) continue;
    parent[b] = a;
    edge.mst = edge.kept = true;
    longest = Math.max(longest, edge.length);
  }
  let loops = 0;
  for (const edge of ordered) {
    if (edge.mst) continue;
    if (loops >= (options.loops ?? (compact ? 1 : 2)) || edge.length > longest * 1.35) break;
    if (hash(seed, edge.a, edge.b) / 4294967296 < 0.45) {
      edge.kept = true;
      loops++;
    }
  }

  // 4. All rooms grow together, one strip per room per round.
  const rooms: Room[] = points.map((p) => ({
    key: "", id: p.id, rect: { x: p.x, y: p.y, w: 1, h: 1 },
    poly: [], ax: p.x, ay: p.y, theme: hash(seed ^ 0x5bd1e995, p.id) % THEME_COUNT,
    objective: p.objective, growth: [],
  }));
  const roomRng = rooms.map((room) => mulberry32(hash(seed, room.id)));
  const limits = roomRng.map((r) => ({
    w: intRng(r, compact ? 3 : 4, compact ? 6 : 9),
    h: intRng(r, 3, compact ? 5 : 6),
  }));
  for (const p of points) owner[p.y * cols + p.x] = p.id;
  let growthRounds = 0;
  while (rooms.length) {
    let grew = false;
    for (const room of rooms) {
      const sides = [0, 1, 2, 3];
      for (let i = sides.length - 1; i > 0; i--) {
        const j = intRng(roomRng[room.id], 0, i);
        [sides[i], sides[j]] = [sides[j], sides[i]];
      }
      const { x, y, w, h } = room.rect;
      for (const side of sides) {
        const next = { x, y, w, h };
        const strip = { x, y, w, h };
        if (side === 0) { next.y--; next.h++; strip.y--; strip.h = 1; }
        if (side === 1) { next.h++; strip.y += h; strip.h = 1; }
        if (side === 2) { next.x--; next.w++; strip.x--; strip.w = 1; }
        if (side === 3) { next.w++; strip.x += w; strip.w = 1; }
        if (next.x < 1 || next.y < 1 || next.x + next.w > cols - 1 ||
            next.y + next.h > rows - 1 || next.w > limits[room.id].w ||
            next.h > limits[room.id].h) continue;
        let free = true;
        for (let sy = strip.y; sy < strip.y + strip.h; sy++) {
          for (let sx = strip.x; sx < strip.x + strip.w; sx++) {
            if (owner[sy * cols + sx] !== EMPTY) free = false;
          }
        }
        if (!free) continue;
        for (let sy = strip.y; sy < strip.y + strip.h; sy++) {
          for (let sx = strip.x; sx < strip.x + strip.w; sx++) owner[sy * cols + sx] = room.id;
        }
        room.rect = next;
        grew = true;
        break;
      }
    }
    if (!grew) break;
    for (const room of rooms) room.growth.push({ ...room.rect });
    growthRounds++;
  }
  const roomCells = rooms.map(() => new Set<number>());
  for (let i = 0; i < owner.length; i++) {
    if (owner[i] >= 0) roomCells[owner[i]].add(i);
  }
  for (const room of rooms) {
    const { x, y, w, h } = room.rect;
    room.key = `r${room.id}:${x},${y},${w},${h}`;
    room.poly = outline(roomCells[room.id], cols);
  }

  // Objective choice uses only graph topology, never the generation RNG.
  const graph: number[][] = rooms.map(() => []);
  for (const { a, b, kept } of edges) {
    if (kept) { graph[a].push(b); graph[b].push(a); }
  }
  const hops = rooms.map(() => -1);
  const queue = rooms.length ? [0] : [];
  if (rooms.length) hops[0] = 0;
  for (let head = 0; head < queue.length; head++) {
    for (const next of graph[queue[head]]) {
      if (hops[next] !== -1) continue;
      hops[next] = hops[queue[head]] + 1;
      queue.push(next);
    }
  }
  const candidates = rooms.slice(1).filter((room) => !room.objective).sort((a, b) =>
    Number(graph[b.id].length === 1) - Number(graph[a.id].length === 1) ||
    hops[b.id] - hops[a.id] || a.id - b.id);
  for (const room of candidates.slice(0, fallback)) {
    room.objective = true;
    points[room.id].objective = true;
  }

  // 5. Cheapest grid routes; each space boundary on a route gets a door.
  const doorKeys = new Set<string>();
  const doors: Door[] = [];
  const connections = ordered.filter((e) => e.kept).sort((a, b) =>
    Number(b.mst) - Number(a.mst) || byLength(a, b));
  for (const edge of connections) {
    const path = route(owner, cols, rows, rooms[edge.a], rooms[edge.b]);
    for (const cell of path) {
      if (owner[cell] === EMPTY) owner[cell] = CORRIDOR;
    }
    for (let i = 1; i < path.length; i++) {
      const from = path[i - 1];
      const to = path[i];
      const oa = owner[from];
      const ob = owner[to];
      if (space(oa) === space(ob)) continue;
      const ax = from % cols;
      const ay = Math.floor(from / cols);
      const bx = to % cols;
      const by = Math.floor(to / cols);
      const vertical = ay === by;
      const x = vertical ? Math.max(ax, bx) : ax;
      const y = vertical ? ay : Math.max(ay, by);
      const key = `${vertical ? "v" : "h"}${x},${y}`;
      if (doorKeys.has(key)) continue;
      doorKeys.add(key);
      // Swing into the room; between rooms, swing into the one entered.
      const [rx, ry] = ob >= 0 ? [bx, by] : [ax, ay];
      const [cx, cy] = ob >= 0 ? [ax, ay] : [bx, by];
      let d: string;
      if (vertical) {
        const X = x;
        const dir = rx > cx ? 1 : -1;
        d = `M${X} ${ay}L${X + dir} ${ay}A1 1 0 0 ${dir > 0 ? 1 : 0} ${X} ${ay + 1}`;
      } else {
        const Y = y;
        const dir = ry > cy ? 1 : -1;
        d = `M${ax} ${Y}L${ax} ${Y + dir}A1 1 0 0 ${dir > 0 ? 0 : 1} ${ax + 1} ${Y}`;
      }
      doors.push({
        key: `d${key}`, d, x, y, vertical,
        rooms: [oa, ob].filter((o) => o >= 0).sort((a, b) => a - b),
      });
    }
  }

  // 6. Floor cells and walls, leaving door edges open.
  const cells: Cell[] = [];
  const halls: Cell[] = [];
  const horizontal = new Map<number, number[]>();
  const vertical = new Map<number, number[]>();
  const push = (map: Map<number, number[]>, line: number, at: number) => {
    const list = map.get(line);
    if (list) list.push(at);
    else map.set(line, [at]);
  };
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const o = owner[y * cols + x];
      if (o === EMPTY) continue;
      const cell = { key: `c${x},${y}`, x, y, room: o };
      cells.push(cell);
      if (o === CORRIDOR) halls.push(cell);
      const up = y > 0 ? owner[(y - 1) * cols + x] : EMPTY;
      const left = x > 0 ? owner[y * cols + x - 1] : EMPTY;
      const right = x < cols - 1 ? owner[y * cols + x + 1] : EMPTY;
      const down = y < rows - 1 ? owner[(y + 1) * cols + x] : EMPTY;
      if (up === EMPTY) push(horizontal, y, x);
      if (left === EMPTY) push(vertical, x, y);
      if (right === EMPTY || (right !== o && !doorKeys.has(`v${x + 1},${y}`)))
        push(vertical, x + 1, y);
      if (down === EMPTY || (down !== o && !doorKeys.has(`h${x},${y + 1}`)))
        push(horizontal, y + 1, x);
    }
  }
  const walls: Segment[] = [];
  const merge = (map: Map<number, number[]>, isHorizontal: boolean) => {
    for (const [line, list] of map) {
      const sorted = [...new Set(list)].sort((a, b) => a - b);
      let start = sorted[0];
      for (let i = 1; i <= sorted.length; i++) {
        if (i < sorted.length && sorted[i] === sorted[i - 1] + 1) continue;
        const end = sorted[i - 1] + 1;
        walls.push(
          isHorizontal
            ? { key: `wh${line}:${start}-${end}`, x1: start, y1: line, x2: end, y2: line }
            : { key: `wv${line}:${start}-${end}`, x1: line, y1: start, x2: line, y2: end },
        );
        start = sorted[i];
      }
    }
  };
  merge(horizontal, true);
  merge(vertical, false);

  // 7. Every room cell is a candidate, including objective rooms.
  const slots: Slot[] = [];
  const slotsByRoom: Slot[][] = rooms.map(() => []);
  const slotAt = new Map<number, Slot>();
  const sides = [
    ["n", 0, -1], ["s", 0, 1], ["w", -1, 0], ["e", 1, 0],
  ] as const;
  const corners = new Set<string>();
  for (const room of rooms) {
    const set = roomCells[room.id];
    for (const cell of set) {
      const x = cell % cols;
      const y = Math.floor(cell / cols);
      const outside = sides.filter(([, dx, dy]) => !set.has((y + dy) * cols + x + dx));
      const slot: Slot = {
        key: `s${room.id}-${x},${y}`, room: room.id, x, y,
        kind: outside.length ? "wall" : "floor", kept: true,
      };
      if (outside.length) slot.side = outside[0][0];
      if (outside.length >= 2) corners.add(slot.key);
      slots.push(slot);
      slotsByRoom[room.id].push(slot);
      slotAt.set(cell, slot);
    }
  }

  // 8. Door clearance, shortest walking lanes, then alternating spacing.
  const prune = (slot: Slot, reason: PruneReason) => {
    slot.kept = false;
    slot.reason = reason;
  };
  for (const room of rooms) {
    const roomSlots = slotsByRoom[room.id];
    const set = roomCells[room.id];
    const entries = doors.filter((d) => d.rooms.includes(room.id))
      .sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0)
      .map((door) => {
        const cell = door.y * cols + door.x;
        const other = cell - (door.vertical ? 1 : cols);
        return set.has(cell) ? cell : other;
      });
    const lane = new Set<number>();
    const walk = (start: number, end: number) => {
      const previous = new Map<number, number>([[start, -1]]);
      const queue = [start];
      for (let head = 0; head < queue.length; head++) {
        const cell = queue[head];
        if (cell === end) break;
        for (const next of neighbours(cell, cols)) {
          if (!set.has(next) || previous.has(next)) continue;
          previous.set(next, cell);
          queue.push(next);
        }
      }
      if (!previous.has(end)) return;
      for (let cell = end; cell !== -1; cell = previous.get(cell)!) lane.add(cell);
    };
    for (let i = 1; i < entries.length; i++) walk(entries[i - 1], entries[i]);
    if (entries.length === 1) walk(entries[0], room.ay * cols + room.ax);
    // Apply clearance first so spacing sees all neighbouring door/lane cells.
    for (const slot of roomSlots) {
      if (room.objective) prune(slot, "objective");
      else if (entries.some((cell) =>
        Math.max(Math.abs(slot.x - cell % cols), Math.abs(slot.y - Math.floor(cell / cols))) <= 1))
        prune(slot, "door");
      else if (lane.has(slot.y * cols + slot.x)) prune(slot, "lane");
    }
    for (const slot of roomSlots) {
      if (!slot.kept) continue;
      if (slot.kind === "floor") {
        let nearLane = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const reason = slotAt.get((slot.y + dy) * cols + slot.x + dx)?.reason;
            if (reason === "door" || reason === "lane") nearLane = true;
          }
        }
        if ((slot.x - room.rect.x) % 2 !== 1 || (slot.y - room.rect.y) % 2 !== 1 || nearLane)
          prune(slot, "spacing");
      } else if (!corners.has(slot.key)) {
        const alongX = slot.side === "n" || slot.side === "s";
        const previous = slotAt.get(slot.y * cols + slot.x - (alongX ? 1 : cols));
        if (previous?.room === room.id && previous.kept && previous.kind === "wall" &&
            previous.side === slot.side && !corners.has(previous.key)) prune(slot, "spacing");
      }
    }
  }

  // 9. Per-room prop streams keep distant rooms stable.
  const props: Prop[] = [];
  for (const room of rooms) {
    if (room.objective) continue;
    const r = mulberry32(seed * 31 + room.id * 104729);
    const roomSlots = slotsByRoom[room.id];
    const wallSlots = roomSlots.filter((s) => s.kind === "wall" && s.kept);
    const used = new Set<string>();
    const want = Math.min(5, Math.max(1, Math.round(roomCells[room.id].size / 7)));
    for (let n = 0, tries = 0; n < want && tries < 40 && wallSlots.length; tries++) {
      const slot = wallSlots[intRng(r, 0, wallSlots.length - 1)];
      if (used.has(slot.key)) continue;
      const alongX = slot.side === "n" || slot.side === "s";
      const next = slotAt.get(slot.y * cols + slot.x + (alongX ? 1 : cols));
      const long = r() < 0.55 && next !== undefined && next.room === room.id &&
        next.kind === "wall" && next.side === slot.side &&
        next.reason !== "door" && next.reason !== "lane" && !used.has(next.key);
      const covered = [slot.key];
      used.add(slot.key);
      if (long && next) {
        covered.push(next.key);
        used.add(next.key);
        next.kept = true;
        delete next.reason;
      }
      props.push({
        key: `p${room.id}-${slot.x},${slot.y}`, room: room.id,
        x: slot.x, y: slot.y,
        w: long && alongX ? 2 : 1, h: long && !alongX ? 2 : 1,
        round: !long && r() < ROUND_CHANCE[room.theme], slots: covered,
      });
      n++;
    }
    for (const slot of roomSlots) {
      if (slot.kind !== "floor" || !slot.kept || r() >= 0.5) continue;
      props.push({
        key: `p${room.id}-${slot.x},${slot.y}`, room: room.id,
        x: slot.x, y: slot.y, w: 1, h: 1,
        round: r() < ROUND_CHANCE[room.theme], slots: [slot.key],
      });
    }
  }

  return { cols, rows, points, triangles, edges, rooms, growthRounds, halls, cells, walls, doors, slots, props };
}
