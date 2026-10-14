/**
 * A small, deterministic sketch of a two-stage level generator for the home
 * page. It is NOT the Unreal Engine 5 generator; it only mirrors the idea:
 * first an abstract map (room footprints and how they connect), then cell
 * data, walls and doors, a theme per room, slots along the walls and the
 * props each room's theme resolves into some of those slots.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Room {
  id: number;
  rects: Rect[];
  /** Outline of the room's cells, in cell units. */
  poly: Array<[number, number]>;
  /** Anchor cell (corridors start and end here). */
  ax: number;
  ay: number;
  bespoke: boolean;
  objective: boolean;
  theme: number;
}

export interface Segment {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Door {
  key: string;
  /** SVG path in cell units: the door leaf, then its swing. */
  d: string;
}

export interface Prop {
  key: string;
  room: number;
  x: number;
  y: number;
  w: number;
  h: number;
  round: boolean;
}

/** A candidate prop position along a room's walls (SetupSlots). */
export interface Slot {
  key: string;
  room: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Cell {
  key: string;
  x: number;
  y: number;
  room: number;
}

export interface LevelMap {
  cols: number;
  rows: number;
  rooms: Room[];
  links: Array<[number, number]>;
  cells: Cell[];
  walls: Segment[];
  doors: Door[];
  slots: Slot[];
  props: Prop[];
}

const EMPTY = -1;
const CORRIDOR = -2;

export const THEME_COUNT = 3;
/** How often each theme resolves a one-cell slot into a round prop. */
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

/** An L-shaped path of cells from a to b. */
function corridor(horizontalFirst: boolean, ax: number, ay: number, bx: number, by: number) {
  const path: Array<[number, number]> = [];
  let x = ax;
  let y = ay;
  path.push([x, y]);
  const stepX = () => {
    while (x !== bx) {
      x += Math.sign(bx - x);
      path.push([x, y]);
    }
  };
  const stepY = () => {
    while (y !== by) {
      y += Math.sign(by - y);
      path.push([x, y]);
    }
  };
  if (horizontalFirst) {
    stepX();
    stepY();
  } else {
    stepY();
    stepX();
  }
  return path;
}

export function generateLevel(
  seed: number,
  cols: number,
  rows: number,
  objectives: number,
): LevelMap {
  const rng = mulberry32(seed);
  const owner = new Int16Array(cols * rows).fill(EMPTY);
  const rooms: Room[] = [];
  const roomCells: Array<Set<number>> = [];
  const compact = cols < 32;
  const int = (lo: number, hi: number) => intRng(rng, lo, hi);

  const fits = (rects: Rect[], roomGap: number, corridorGap: number) =>
    rects.every((r) => {
      if (r.x < 1 || r.y < 1 || r.x + r.w > cols - 1 || r.y + r.h > rows - 1) return false;
      for (let y = r.y - roomGap; y < r.y + r.h + roomGap; y++) {
        if (y < 0 || y >= rows) continue;
        for (let x = r.x - roomGap; x < r.x + r.w + roomGap; x++) {
          if (x < 0 || x >= cols) continue;
          const o = owner[y * cols + x];
          if (o >= 0) return false;
          if (o === CORRIDOR) {
            const dx = x < r.x ? r.x - x : x >= r.x + r.w ? x - (r.x + r.w - 1) : 0;
            const dy = y < r.y ? r.y - y : y >= r.y + r.h ? y - (r.y + r.h - 1) : 0;
            if (Math.max(dx, dy) <= corridorGap) return false;
          }
        }
      }
      return true;
    });

  const addRoom = (rects: Rect[], bespoke: boolean, objective: boolean, theme: number) => {
    const id = rooms.length;
    const set = new Set<number>();
    for (const r of rects) {
      for (let y = r.y; y < r.y + r.h; y++) {
        for (let x = r.x; x < r.x + r.w; x++) {
          owner[y * cols + x] = id;
          set.add(y * cols + x);
        }
      }
    }
    const main = rects[0];
    rooms.push({
      id,
      rects,
      poly: outline(set, cols),
      ax: main.x + Math.floor(main.w / 2),
      ay: main.y + Math.floor(main.h / 2),
      bespoke,
      objective,
      theme,
    });
    roomCells.push(set);
    return id;
  };

  // Bespoke room: an authored L-shape, placed first.
  {
    const w1 = compact ? int(4, 5) : int(5, 7);
    const h1 = 3;
    const w2 = 3;
    const h2 = int(2, 3);
    const leftLeg = rng() < 0.5;
    const legBelow = rng() < 0.5;
    for (let attempt = 0; attempt < 200; attempt++) {
      const ox = int(1, cols - w1 - 1);
      const oy = int(1, rows - h1 - h2 - 1);
      const main = { x: ox, y: oy + (legBelow ? 0 : h2), w: w1, h: h1 };
      const leg = { x: ox + (leftLeg ? 0 : w1 - w2), y: oy + (legBelow ? h1 : 0), w: w2, h: h2 };
      if (fits([main, leg], 2, 0)) {
        addRoom([main, leg], true, false, 0);
        break;
      }
    }
  }

  // Generated footprints.
  const target = Math.max(4, Math.round((cols * rows) / (compact ? 72 : 88)));
  for (let attempt = 0; attempt < 600 && rooms.length < target; attempt++) {
    const w = compact ? int(3, 6) : int(3, 8);
    const h = compact ? int(3, 5) : int(3, 6);
    const r = { x: int(1, cols - w - 1), y: int(1, rows - h - 1), w, h };
    if (fits([r], 2, 0)) addRoom([r], false, false, int(0, THEME_COUNT - 1));
  }

  // Abstract connections: a minimum spanning tree, plus a loop or two.
  const dist = (a: Room, b: Room) => Math.hypot(a.ax - b.ax, a.ay - b.ay);
  const links: Array<[number, number]> = [];
  {
    const inTree = new Set([0]);
    let longest = 0;
    while (inTree.size < rooms.length) {
      let best: [number, number] | null = null;
      let bestD = Infinity;
      for (const a of inTree) {
        for (const b of rooms) {
          if (inTree.has(b.id)) continue;
          const d = dist(rooms[a], b);
          if (d < bestD) {
            bestD = d;
            best = [a, b.id];
          }
        }
      }
      if (!best) break;
      links.push(best);
      inTree.add(best[1]);
      longest = Math.max(longest, bestD);
    }
    const has = (a: number, b: number) =>
      links.some(([p, q]) => (p === a && q === b) || (p === b && q === a));
    const extras: Array<[number, number, number]> = [];
    for (let a = 0; a < rooms.length; a++) {
      for (let b = a + 1; b < rooms.length; b++) {
        if (!has(a, b)) extras.push([a, b, dist(rooms[a], rooms[b])]);
      }
    }
    extras.sort((p, q) => p[2] - q[2]);
    let loops = compact ? 1 : 2;
    for (const [a, b, d] of extras) {
      if (loops <= 0 || d > longest * 1.25) break;
      if (rng() < 0.6) {
        links.push([a, b]);
        loops--;
      }
    }
  }

  const paths: Array<Array<[number, number]>> = [];
  // Of the two L-shaped routes, take the one that runs through fewer other
  // rooms, hugs fewer walls and reuses more of the existing corridors.
  const cost = (path: Array<[number, number]>, a: Room, b: Room) => {
    let total = 0;
    for (const [x, y] of path) {
      const o = owner[y * cols + x];
      if (o === a.id || o === b.id) continue;
      if (o >= 0) total += 4;
      else if (o === CORRIDOR) total -= 0.6;
      else {
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const n = owner[ny * cols + nx];
          if (n >= 0 && n !== a.id && n !== b.id) total += 1.5;
          else if (n === CORRIDOR) total += 0.8;
        }
      }
    }
    return total;
  };
  const carve = (a: Room, b: Room, r: Rng) => {
    const first = r() < 0.5;
    const p1 = corridor(first, a.ax, a.ay, b.ax, b.ay);
    const p2 = corridor(!first, a.ax, a.ay, b.ax, b.ay);
    const path = cost(p2, a, b) < cost(p1, a, b) ? p2 : p1;
    for (const [x, y] of path) {
      if (owner[y * cols + x] === EMPTY) owner[y * cols + x] = CORRIDOR;
    }
    paths.push(path);
  };
  for (const [a, b] of links) carve(rooms[a], rooms[b], rng);

  // Themes come from the base seed so they never shift when objectives are added.
  const themeRng = mulberry32(seed ^ 0x5bd1e995);
  for (const room of rooms) {
    if (!room.bespoke) room.theme = intRng(themeRng, 0, THEME_COUNT - 1);
  }

  // Objectives: each one makes a room to hold it, or claims a quiet room.
  for (let k = 0; k < objectives; k++) {
    const r = mulberry32(seed + 7919 * (k + 1));
    let placed = false;
    for (let attempt = 0; attempt < 400 && !placed; attempt++) {
      const w = intRng(r, 3, compact ? 4 : 5);
      const h = intRng(r, 3, 4);
      const rect = { x: intRng(r, 1, cols - w - 1), y: intRng(r, 1, rows - h - 1), w, h };
      if (!fits([rect], 1, 1)) continue;
      const id = addRoom([rect], false, true, 0);
      const room = rooms[id];
      let nearest = rooms[0];
      for (const other of rooms) {
        if (other.id !== id && dist(room, other) < dist(room, nearest)) nearest = other;
      }
      links.push([nearest.id, id]);
      carve(room, nearest, r);
      placed = true;
    }
    if (placed) continue;
    const degree = (id: number) => links.filter(([a, b]) => a === id || b === id).length;
    const open = rooms.filter((room) => !room.objective);
    if (!open.length) break;
    const leaves = open.filter((room) => degree(room.id) <= 1);
    const pool = leaves.length ? leaves : open;
    pool[Math.floor(r() * pool.length)].objective = true;
  }

  // Doors: wherever a corridor crosses into a room.
  const edgeKey = (ax: number, ay: number, bx: number, by: number) =>
    ay === by ? `v${Math.max(ax, bx)},${ay}` : `h${ax},${Math.max(ay, by)}`;
  const doorKeys = new Set<string>();
  const doors: Door[] = [];
  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      const [ax, ay] = path[i];
      const [bx, by] = path[i + 1];
      const oa = owner[ay * cols + ax];
      const ob = owner[by * cols + bx];
      if (oa === ob || (oa >= 0 && ob >= 0)) continue;
      const key = edgeKey(ax, ay, bx, by);
      if (doorKeys.has(key)) continue;
      doorKeys.add(key);
      // The leaf swings into the room.
      const [rx, ry] = oa >= 0 ? [ax, ay] : [bx, by];
      const [cx, cy] = oa >= 0 ? [bx, by] : [ax, ay];
      let d: string;
      if (ay === by) {
        const X = Math.max(ax, bx);
        const dir = rx > cx ? 1 : -1;
        d = `M${X} ${ay}L${X + dir} ${ay}A1 1 0 0 ${dir > 0 ? 1 : 0} ${X} ${ay + 1}`;
      } else {
        const Y = Math.max(ay, by);
        const dir = ry > cy ? 1 : -1;
        d = `M${ax} ${Y}L${ax} ${Y + dir}A1 1 0 0 ${dir > 0 ? 0 : 1} ${ax + 1} ${Y}`;
      }
      doors.push({ key: `d${key}`, d });
    }
  }

  // Cells, and walls wherever floor meets void or a different space.
  const group = (o: number) => (o >= 0 ? o : o === CORRIDOR ? CORRIDOR : EMPTY);
  const cells: Cell[] = [];
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
      if (o === EMPTY) {
        // Void cells only matter as neighbours of floor.
        continue;
      }
      cells.push({ key: `c${y * cols + x}`, x, y, room: o });
      const g = group(o);
      const up = y > 0 ? owner[(y - 1) * cols + x] : EMPTY;
      const left = x > 0 ? owner[y * cols + x - 1] : EMPTY;
      const right = x < cols - 1 ? owner[y * cols + x + 1] : EMPTY;
      const down = y < rows - 1 ? owner[(y + 1) * cols + x] : EMPTY;
      if (up === EMPTY) push(horizontal, y, x);
      if (left === EMPTY) push(vertical, x, y);
      if (right === EMPTY || (group(right) !== g && !doorKeys.has(`v${x + 1},${y}`)))
        push(vertical, x + 1, y);
      if (down === EMPTY || (group(down) !== g && !doorKeys.has(`h${x},${y + 1}`)))
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

  // SetupSlots: every wall-side cell kept clear of doorways is a slot.
  // ResolveSlots: each room's theme fills some of them with props.
  const slots: Slot[] = [];
  const props: Prop[] = [];
  const nearDoor = (x: number, y: number) =>
    [
      `v${x},${y}`,
      `v${x + 1},${y}`,
      `h${x},${y}`,
      `h${x},${y + 1}`,
    ].some((k) => doorKeys.has(k));
  for (const room of rooms) {
    if (room.objective) continue;
    const r = mulberry32(seed * 31 + room.id * 104729);
    const set = roomCells[room.id];
    const inRoom = (x: number, y: number) => set.has(y * cols + x);
    const clear = (x: number, y: number) =>
      inRoom(x, y) &&
      !nearDoor(x, y) &&
      ![
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dx, dy]) => inRoom(x + dx, y + dy) && nearDoor(x + dx, y + dy));
    const edge: Array<[number, number]> = [];
    for (const i of set) {
      const x = i % cols;
      const y = Math.floor(i / cols);
      const onWall = !inRoom(x + 1, y) || !inRoom(x - 1, y) || !inRoom(x, y + 1) || !inRoom(x, y - 1);
      if (onWall && clear(x, y)) edge.push([x, y]);
    }
    edge.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    for (const [x, y] of edge) slots.push({ key: `s${room.id}-${x},${y}`, room: room.id, x, y, w: 1, h: 1 });
    const used = new Set<number>();
    const want = Math.min(4, Math.max(1, Math.round(set.size / 8)));
    for (let n = 0, tries = 0; n < want && tries < 40 && edge.length; tries++) {
      const [x, y] = edge[Math.floor(r() * edge.length)];
      if (used.has(y * cols + x)) continue;
      // Stretch along the wall when the next cell is free too.
      const alongX = !inRoom(x, y - 1) || !inRoom(x, y + 1);
      const nx = alongX ? x + 1 : x;
      const ny = alongX ? y : y + 1;
      const long =
        r() < 0.55 && clear(nx, ny) && !used.has(ny * cols + nx) && edge.some(([ex, ey]) => ex === nx && ey === ny);
      used.add(y * cols + x);
      if (long) used.add(ny * cols + nx);
      props.push({
        key: `p${room.id}-${x},${y}`,
        room: room.id,
        x,
        y,
        w: long && alongX ? 2 : 1,
        h: long && !alongX ? 2 : 1,
        round: !long && r() < ROUND_CHANCE[room.theme],
      });
      n++;
    }
    // A table in the middle of larger rooms.
    const main = room.rects[0];
    if (main.w >= 5 && main.h >= 4) {
      const tx = main.x + Math.floor(main.w / 2) - 1;
      const ty = main.y + Math.floor(main.h / 2);
      if (clear(tx, ty) && clear(tx + 1, ty) && !used.has(ty * cols + tx) && !used.has(ty * cols + tx + 1)) {
        slots.push({ key: `s${room.id}-t`, room: room.id, x: tx, y: ty, w: 2, h: 1 });
        props.push({ key: `p${room.id}-t`, room: room.id, x: tx, y: ty, w: 2, h: 1, round: false });
      }
    }
  }

  return { cols, rows, rooms, links, cells, walls, doors, slots, props };
}
