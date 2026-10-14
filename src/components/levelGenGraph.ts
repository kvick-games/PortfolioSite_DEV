/**
 * The level generator's real pipeline diagram (Resources/Site/img/
 * levelgenerator-mapgenpipeline.webp) as data: the same nodes, labels, edge
 * topology and port markers, re-laid out more compactly so the labels stay
 * legible at the width of the home page column. Coordinates are in a
 * GRAPH_W x GRAPH_H box.
 */

export type Role = "mode" | "actor" | "fn" | "data";
export type Port = "arrow" | "diamond" | "dot";
/** Map layers, as named on the floor plan's groups (data-layer). */
export type Layer =
  | "bespoke"
  | "footprints"
  | "graph"
  | "cells"
  | "walls"
  | "doors"
  | "floor"
  | "slots"
  | "props"
  | "objective";

export interface PipeNode {
  id: string;
  label: string;
  /** Second line, for the one two-line label. */
  label2?: string;
  role: Role;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Phases in which this node runs (the first one is where a click jumps). */
  phases: number[];
  /** When it lights up within its phase, in ms. */
  at: number;
  /** Phases that read this node without re-running it. */
  consulted?: number[];
  /** What it produces on the floor plan. */
  produces: Layer[];
  /** One line on what it does, kept to what the site and diagram say. */
  about: string;
}

export interface PipeEdge {
  id: string;
  from: string;
  to: string;
  pts: Array<[number, number]>;
  end: Port;
  phase: number;
  at: number;
  label?: { text: string; x: number; y: number };
}

export const GRAPH_W = 960;
export const GRAPH_H = 356;

/** Phase 0 is empty, 1 to 7 are the steps, 8 is the finished level. */
export const PHASES = [
  "",
  "LevelConfig",
  "CreateMapData()",
  "MapData",
  "CellData[]",
  "ConstructMapMesh()",
  "SetupSlots()",
  "ResolveSlots()",
  "",
];
export const LAST_STEP = 7;
export const DONE = 8;
/** How long each phase holds during autoplay, in ms. */
export const PHASE_MS = [0, 1150, 1350, 1050, 1450, 1350, 1400, 1150];

/** Where the timeline's playhead sits in each phase. */
export const PLAYHEAD = [104, 200, 304, 420, 540, 664, 824, 865, 952];
/** The four milestones on the real diagram's timeline. */
export const MILESTONES = [
  { x: 304, phase: 2, label: "CreateMapData()" },
  { x: 664, phase: 5, label: "ConstructMapMesh()" },
  { x: 824, phase: 6, label: "PopulateRooms()" },
  { x: 865, phase: 7, label: "SpawnProps()" },
];
export const TIMELINE = { x1: 104, x2: 952, y: 22 };

export const NODES: PipeNode[] = [
  { id: "gamemode", label: "GameMode", role: "mode", x: 8, y: 52, w: 100, h: 32, phases: [1], at: 0, produces: [], about: "Starts level generation through the LevelGenerationManager." },
  { id: "manager", label: "LevelGenerationManager", role: "data", x: 44, y: 104, w: 176, h: 30, phases: [1], at: 300, produces: [], about: "Passes the request from GameMode on: it holds the LevelConfig and feeds CreateMapData()." },
  { id: "config", label: "LevelConfig", role: "data", x: 80, y: 186, w: 112, h: 30, phases: [1], at: 600, produces: ["bespoke"], about: "The level's settings: the bespoke rooms to place, and the footprints to generate." },
  { id: "configBespoke", label: "BespokeRooms", role: "data", x: 114, y: 262, w: 120, h: 28, phases: [1], at: 850, produces: ["bespoke"], about: "Authored rooms the config asks for. In this sketch, one L-shaped room." },
  { id: "spawner", label: "LevelSpawner", role: "actor", x: 322, y: 52, w: 118, h: 32, phases: [2, 5, 6], at: 0, produces: [], about: "Executes the three passes in order: CreateMapData(), ConstructMapMesh(), PopulateRooms()." },
  { id: "create", label: "CreateMapData()", role: "fn", x: 240, y: 140, w: 128, h: 34, phases: [2], at: 280, produces: ["footprints", "graph", "objective"], about: "Builds the abstract map: places the bespoke rooms, generates footprints around them and links them." },
  { id: "footprints", label: "Generated Room", label2: "Footprints", role: "data", x: 240, y: 224, w: 128, h: 40, phases: [2], at: 650, produces: ["footprints"], about: "Outlines of the generated rooms, before any geometry exists." },
  { id: "mapdata", label: "MapData", role: "data", x: 422, y: 140, w: 110, h: 34, phases: [3], at: 220, produces: ["footprints", "graph"], about: "The abstract, serializable map. Every later pass builds from it." },
  { id: "mapBespoke", label: "BespokeRooms", role: "data", x: 458, y: 198, w: 120, h: 28, phases: [3], at: 560, produces: ["bespoke"], about: "The bespoke rooms, as placed in the map." },
  { id: "rooms", label: "GeneratedRooms", role: "data", x: 458, y: 236, w: 132, h: 28, phases: [3], at: 650, produces: ["footprints"], about: "The generated rooms, each with its cells and a Theme." },
  { id: "cells", label: "CellData[]", role: "data", x: 494, y: 276, w: 100, h: 30, phases: [4], at: 240, produces: ["cells", "walls", "doors"], about: "Per-cell data for each room, including which edges are walls and which are doors." },
  { id: "wall", label: "Wall", role: "data", x: 626, y: 280, w: 72, h: 24, phases: [4], at: 600, produces: ["walls"], about: "A cell edge marked as a wall." },
  { id: "door", label: "Door", role: "data", x: 626, y: 310, w: 72, h: 24, phases: [4], at: 720, produces: ["doors"], about: "A cell edge marked as a doorway." },
  { id: "theme", label: "Theme", role: "data", x: 494, y: 318, w: 100, h: 28, phases: [4], at: 860, consulted: [5, 7], produces: ["floor"], about: "A modular object given to each room. Later phases consult it for floors and props." },
  { id: "construct", label: "ConstructMapMesh()", role: "fn", x: 588, y: 140, w: 152, h: 34, phases: [5], at: 260, produces: ["walls", "doors", "floor"], about: "Builds the level from MapData: walls, doors and floors, consulting each room's Theme." },
  { id: "populate", label: "PopulateRooms()", role: "fn", x: 760, y: 140, w: 128, h: 34, phases: [6], at: 220, produces: ["slots", "props"], about: "Fills the built rooms with props, through SpawnProps()." },
  { id: "spawnProps", label: "SpawnProps()", role: "fn", x: 804, y: 212, w: 122, h: 32, phases: [6], at: 560, produces: ["slots", "props"], about: "Sets up slots for props, then resolves them." },
  { id: "setup", label: "SetupSlots()", role: "fn", x: 842, y: 270, w: 110, h: 28, phases: [6], at: 880, produces: ["slots"], about: "Marks where props could go. In this sketch, wall-side cells kept clear of doorways." },
  { id: "resolve", label: "ResolveSlots()", role: "fn", x: 842, y: 306, w: 110, h: 28, phases: [7], at: 220, produces: ["props"], about: "Decides what fills each slot from the room's Theme. Some slots stay empty." },
];

export const NODE = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<string, PipeNode>;

export const EDGES: PipeEdge[] = [
  { id: "gamemode-manager", from: "gamemode", to: "manager", end: "arrow", phase: 1, at: 100, pts: [[24, 84], [24, 119], [44, 119]] },
  { id: "manager-config", from: "manager", to: "config", end: "arrow", phase: 1, at: 420, pts: [[62, 134], [62, 201], [80, 201]] },
  { id: "config-configBespoke", from: "config", to: "configBespoke", end: "diamond", phase: 1, at: 700, pts: [[96, 216], [96, 276], [114, 276]] },
  { id: "manager-create", from: "manager", to: "create", end: "diamond", phase: 2, at: 0, pts: [[62, 134], [62, 151], [240, 151]] },
  { id: "config-create", from: "config", to: "create", end: "dot", phase: 2, at: 0, pts: [[192, 201], [214, 201], [214, 165], [240, 165]] },
  {
    id: "spawner-create",
    from: "spawner",
    to: "create",
    end: "arrow",
    phase: 2,
    at: 0,
    pts: [[381, 84], [381, 112], [304, 112], [304, 140]],
    label: { text: "Executes", x: 342, y: 112 },
  },
  { id: "create-footprints", from: "create", to: "footprints", end: "dot", phase: 2, at: 450, pts: [[304, 174], [304, 224]] },
  {
    id: "config-footprints",
    from: "config",
    to: "footprints",
    end: "arrow",
    phase: 2,
    at: 450,
    pts: [[192, 201], [214, 201], [214, 244], [240, 244]],
    label: { text: "Outputs", x: 214, y: 224 },
  },
  {
    id: "create-mapdata",
    from: "create",
    to: "mapdata",
    end: "arrow",
    phase: 3,
    at: 0,
    pts: [[368, 157], [422, 157]],
    label: { text: "Outputs", x: 393, y: 157 },
  },
  { id: "mapdata-mapBespoke", from: "mapdata", to: "mapBespoke", end: "arrow", phase: 3, at: 380, pts: [[440, 174], [440, 212], [458, 212]] },
  { id: "mapdata-rooms", from: "mapdata", to: "rooms", end: "dot", phase: 3, at: 440, pts: [[440, 174], [440, 250], [458, 250]] },
  { id: "rooms-cells", from: "rooms", to: "cells", end: "diamond", phase: 4, at: 0, pts: [[474, 264], [474, 291], [494, 291]] },
  { id: "cells-wall", from: "cells", to: "wall", end: "diamond", phase: 4, at: 420, pts: [[594, 292], [626, 292]] },
  { id: "cells-door", from: "cells", to: "door", end: "diamond", phase: 4, at: 520, pts: [[594, 292], [610, 292], [610, 322], [626, 322]] },
  { id: "rooms-theme", from: "rooms", to: "theme", end: "diamond", phase: 4, at: 620, pts: [[474, 264], [474, 332], [494, 332]] },
  { id: "spawner-construct", from: "spawner", to: "construct", end: "arrow", phase: 5, at: 0, pts: [[381, 84], [381, 112], [664, 112], [664, 140]] },
  { id: "mapdata-construct", from: "mapdata", to: "construct", end: "dot", phase: 5, at: 0, pts: [[532, 157], [588, 157]] },
  { id: "spawner-populate", from: "spawner", to: "populate", end: "arrow", phase: 6, at: 0, pts: [[381, 84], [381, 112], [824, 112], [824, 140]] },
  { id: "populate-spawnProps", from: "populate", to: "spawnProps", end: "arrow", phase: 6, at: 380, pts: [[824, 174], [824, 193], [865, 193], [865, 212]] },
  { id: "spawnProps-setup", from: "spawnProps", to: "setup", end: "arrow", phase: 6, at: 720, pts: [[822, 244], [822, 284], [842, 284]] },
  { id: "spawnProps-resolve", from: "spawnProps", to: "resolve", end: "arrow", phase: 7, at: 0, pts: [[822, 244], [822, 320], [842, 320]] },
];

/**
 * The phone form: one row per phase. `node` items are buttons (each node
 * appears once); `text` items name an input that belongs to an earlier row.
 */
export type RowItem = { node: string } | { text: string } | { port: Port };
export const ROWS: Array<{ phase: number; items: RowItem[] }> = [
  {
    phase: 1,
    items: [
      { node: "gamemode" },
      { port: "arrow" },
      { node: "manager" },
      { port: "arrow" },
      { node: "config" },
      { port: "diamond" },
      { node: "configBespoke" },
    ],
  },
  {
    phase: 2,
    items: [
      { node: "spawner" },
      { text: "executes" },
      { node: "create" },
      { port: "dot" },
      { node: "footprints" },
    ],
  },
  {
    phase: 3,
    items: [{ text: "outputs" }, { node: "mapdata" }, { port: "arrow" }, { node: "mapBespoke" }, { node: "rooms" }],
  },
  {
    phase: 4,
    items: [
      { text: "GeneratedRooms" },
      { port: "diamond" },
      { node: "cells" },
      { port: "diamond" },
      { node: "wall" },
      { node: "door" },
      { node: "theme" },
    ],
  },
  { phase: 5, items: [{ text: "MapData" }, { port: "dot" }, { node: "construct" }] },
  {
    phase: 6,
    items: [{ node: "populate" }, { port: "arrow" }, { node: "spawnProps" }, { port: "arrow" }, { node: "setup" }],
  },
  { phase: 7, items: [{ text: "SpawnProps()" }, { port: "arrow" }, { node: "resolve" }] },
];

/** Where each map layer appears, and how far into its phase (ms). */
export const LAYER_AT: Record<Layer, [number, number]> = {
  bespoke: [1, 700],
  footprints: [2, 500],
  graph: [3, 320],
  cells: [4, 200],
  walls: [5, 320],
  doors: [5, 700],
  floor: [5, 520],
  slots: [6, 900],
  props: [7, 300],
  objective: [2, 500],
};

export function pathOf(pts: Array<[number, number]>) {
  return pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join("");
}

/** The port marker drawn where an edge meets its target. */
export function portOf(edge: PipeEdge) {
  const [x, y] = edge.pts[edge.pts.length - 1];
  const [px, py] = edge.pts[edge.pts.length - 2];
  const dx = Math.sign(x - px);
  const dy = Math.sign(y - py);
  if (edge.end === "dot") return { kind: "dot" as const, d: "", x, y };
  if (edge.end === "diamond") {
    const s = 4.2;
    return {
      kind: "diamond" as const,
      d: `M${x} ${y - s}L${x + s} ${y}L${x} ${y + s}L${x - s} ${y}Z`,
      x,
      y,
    };
  }
  // Arrowhead: tip on the box edge, pointing along the last segment.
  const l = 7;
  const w = 4;
  const bx = x - dx * l;
  const by = y - dy * l;
  return {
    kind: "arrow" as const,
    d: `M${x} ${y}L${bx - dy * w} ${by + dx * w}L${bx + dy * w} ${by - dx * w}Z`,
    x,
    y,
  };
}
