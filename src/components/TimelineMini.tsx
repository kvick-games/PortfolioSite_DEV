import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Link } from "react-router-dom";
import snapshot from "../data/aiTimeline.json";
import SmokeField from "./SmokeField";
import "../timeline-mini.css";

/*
 * A mini, interactive copy of the DREAMATRON AI Timeline (dreamatron.ai/timeline).
 * The data is a static snapshot; see the "source" field in src/data/aiTimeline.json.
 * The visual language (lane colours, tilted pills, gap labels, landmark halos,
 * the label-lift algorithm) follows @kvick-games/timeline-library.
 *
 * Panning never goes through React: the world layer is translated directly.
 * React only re-renders on zoom, resize and hover.
 */

type Release = { name: string; date: string; gap?: number; landmark?: boolean };
type Lane = {
  id: string;
  company: string;
  label: string;
  accent: string;
  marker: string;
  averageGap: number | null;
  releases: Release[];
};

const lanes = snapshot.lanes as Lane[];
// On a phone the board keeps the four headline lines, so each gets room to read.
const COMPACT_LANES = new Set(["openai-gpt", "anthropic-claude", "google-gemini", "xai-grok"]);
const compactLanes = lanes.filter((lane) => COMPACT_LANES.has(lane.id));
const DAY_MS = 86_400_000;
const toTime = (date: string) => Date.parse(`${date}T00:00:00Z`);
const WINDOW_START = toTime(snapshot.window.start);
const TOTAL_DAYS = Math.round((toTime(snapshot.window.end) - WINDOW_START) / DAY_MS);
const dayOf = (date: string) => Math.round((toTime(date) - WINDOW_START) / DAY_MS);
const AS_OF_DAY = dayOf(snapshot.source.asOf);

const formatDate = (date: string) =>
  new Date(toTime(date)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
const AS_OF_LABEL = formatDate(snapshot.source.asOf);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Month gridlines across the window.
const monthTicks = (() => {
  const ticks: { day: number; month: number; year: number }[] = [];
  const cursor = new Date(WINDOW_START);
  cursor.setUTCDate(1);
  while (cursor.getTime() <= WINDOW_START + TOTAL_DAYS * DAY_MS) {
    const day = Math.round((cursor.getTime() - WINDOW_START) / DAY_MS);
    if (day >= 0) ticks.push({ day, month: cursor.getUTCMonth(), year: cursor.getUTCFullYear() });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return ticks;
})();

function hexToRgb(hex: string) {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}
const rgba = (hex: string, alpha: number) => `rgba(${hexToRgb(hex).join(", ")}, ${alpha})`;
const towardWhite = (hex: string, amount: number) =>
  `rgb(${hexToRgb(hex)
    .map((c) => Math.round(c + (255 - c) * amount))
    .join(", ")})`;

function cadence(gap: number, average: number | null) {
  if (!average) return null;
  const diff = gap - average;
  const magnitude = Math.abs(diff);
  if (magnitude <= 2) return `On pace with this line’s ${average}-day average`;
  return `${magnitude} ${magnitude === 1 ? "day" : "days"} ${diff > 0 ? "slower" : "faster"} than this line’s ${average}-day average`;
}

// Label geometry. Pills rise at -28deg from just right of the pin.
const ANGLE = (28 * Math.PI) / 180;
const SIN = Math.sin(ANGLE);
const COS = Math.cos(ANGLE);
const ANCHOR_X = 9;
const ANCHOR_Y = 7; // up from the lane line
const CLEARANCE = 3;
const MAX_LIFT = 120;

type LabelMetrics = { fontSize: number; height: number; chrome: number };
type Placement = { lift: number; shiftX: number; leader: number };

let measureContext: CanvasRenderingContext2D | null | undefined;
function measureLabel(text: string, metrics: LabelMetrics) {
  if (measureContext === undefined) measureContext = document.createElement("canvas").getContext("2d");
  let width = text.length * metrics.fontSize * 0.56;
  if (measureContext) {
    measureContext.font = `600 ${metrics.fontSize}px "Instrument Sans", "Helvetica Neue", Arial, sans-serif`;
    width = measureContext.measureText(text).width;
  }
  return width + text.length * metrics.fontSize * 0.01 + metrics.chrome;
}

/**
 * Port of the live timeline's label lift: when two tilted pills collide, the
 * earlier one rises onto a leader line until it clears the later one, so a
 * leader never passes through a later label.
 */
function placeLabels(xs: number[], names: string[], metrics: LabelMetrics): Placement[] {
  const h = metrics.height;
  const band = h + CLEARANCE;
  const tip = (h / 2) * COS;
  const liftedShift = (h / 2) * SIN - ANCHOR_X;
  const minLift = Math.max(4, 12 - ANCHOR_Y - tip);
  const labels = xs.map((x, i) => ({ x, lift: 0, width: measureLabel(names[i], metrics) }));
  const bandOf = (x: number, lift: number) => {
    const ax = x + ANCHOR_X + (lift > 0 ? liftedShift : 0);
    const ay = ANCHOR_Y + lift;
    return { n: -ax * SIN + ay * COS, s: ax * COS + ay * SIN };
  };
  type L = (typeof labels)[number];
  const collides = (a: L, b: L) => {
    const p = bandOf(a.x, a.lift);
    const q = bandOf(b.x, b.lift);
    const along = q.s - p.s;
    return Math.abs(p.n - q.n) < band && along < a.width + CLEARANCE && -along < b.width + CLEARANCE;
  };
  for (let i = labels.length - 2; i >= 0; i -= 1) {
    const label = labels[i];
    const later = labels.slice(i + 1).filter((o) => o.x - label.x < label.width / COS + band);
    if (!later.some((o) => collides(label, o))) continue;
    const base = bandOf(label.x, 0).n - liftedShift * SIN;
    const candidates = later
      .map((o) => Math.max(minLift, (bandOf(o.x, o.lift).n + band - base) / COS + 0.5))
      .sort((a, b) => a - b);
    const lift = candidates.find((c) => later.every((o) => !collides({ ...label, lift: c }, o)));
    label.lift = Math.min(MAX_LIFT, lift ?? candidates[candidates.length - 1]);
  }
  return labels.map(({ lift }) => {
    const rounded = Math.round(lift);
    return rounded > 0
      ? { lift: rounded, shiftX: liftedShift, leader: ANCHOR_Y + rounded + tip + 4 }
      : { lift: 0, shiftX: 0, leader: 0 };
  });
}

type Layout = { width: number; height: number; compact: boolean; cardRight: number };
type Hover = { lane: number; index: number; kind: "release" | "gap" } | null;

const MAX_PPD = 12;
const ZOOM_STEP = 1.45;

export default function TimelineMini() {
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const ppdRef = useRef(3);
  const interactedRef = useRef(false);
  const inertiaRef = useRef(0);
  const zoomAnimRef = useRef(0);
  const dragRef = useRef<{
    id: number;
    startX: number;
    startOffset: number;
    lastX: number;
    lastT: number;
    velocity: number;
    moved: boolean;
  } | null>(null);

  const [layout, setLayout] = useState<Layout | null>(null);
  const [ppd, setPpd] = useState(3);
  const [grid, setGrid] = useState(true);
  const [hover, setHover] = useState<Hover>(null);
  const [dragging, setDragging] = useState(false);
  const [fontsReady, setFontsReady] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    document.fonts?.ready.then(() => setFontsReady((n) => n + 1));
    return () => query.removeEventListener("change", update);
  }, []);

  const minPpd = layout ? Math.max(0.8, layout.width / TOTAL_DAYS) : 0.8;

  const clampOffset = useCallback(
    (x: number, scale = ppdRef.current) => {
      if (!layout) return x;
      const worldWidth = TOTAL_DAYS * scale;
      return Math.min(0, Math.max(layout.width - worldWidth, x));
    },
    [layout],
  );

  const applyOffset = useCallback((x: number) => {
    offsetRef.current = x;
    if (worldRef.current) worldRef.current.style.transform = `translate3d(${Math.round(x)}px, 0, 0)`;
  }, []);

  // The resting view: the latest months, with the snapshot date near the right
  // and the earlier releases running under the copy panel.
  const homeView = useCallback((l: Layout) => {
    const future = l.compact ? Math.min(150, l.width * 0.38) : Math.min(340, Math.max(250, l.width * 0.22));
    const nowX = l.width - future;
    const visibleLeft = l.compact ? 12 : l.cardRight + 24;
    // Keep label density steady: narrower boards show fewer months.
    const spanDays = l.compact ? 115 : Math.min(235, Math.max(120, (nowX - visibleLeft) / 3.1));
    const scale = Math.min(MAX_PPD, Math.max(l.width / TOTAL_DAYS, (nowX - visibleLeft) / spanDays));
    return { scale, offset: nowX - AS_OF_DAY * scale };
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      const field = fieldRef.current;
      if (!field) return;
      const width = field.clientWidth;
      const height = field.clientHeight;
      const compact = width < 760;
      const card = cardRef.current;
      const cardRight = !compact && card ? card.offsetLeft + card.offsetWidth : 0;
      setLayout((prev) =>
        prev && prev.width === width && prev.height === height && prev.cardRight === cardRight
          ? prev
          : { width, height, compact, cardRight },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  // First layout, and any resize before the visitor has touched the board,
  // goes to the home view; after that a resize only re-clamps.
  useLayoutEffect(() => {
    if (!layout) return;
    if (!interactedRef.current) {
      const home = homeView(layout);
      ppdRef.current = home.scale;
      setPpd(home.scale);
      applyOffset(Math.min(0, Math.max(layout.width - TOTAL_DAYS * home.scale, home.offset)));
    } else {
      applyOffset(clampOffset(offsetRef.current));
    }
  }, [layout, homeView, applyOffset, clampOffset]);

  useLayoutEffect(() => {
    applyOffset(offsetRef.current);
  }, [ppd, applyOffset]);

  const stopMotion = () => {
    cancelAnimationFrame(inertiaRef.current);
    cancelAnimationFrame(zoomAnimRef.current);
  };

  const zoomTo = useCallback(
    (target: number, anchorX?: number, animate = false) => {
      if (!layout) return;
      interactedRef.current = true;
      const next = Math.min(MAX_PPD, Math.max(minPpd, target));
      const anchor = anchorX ?? (layout.cardRight + layout.width) / 2;
      const apply = (scale: number) => {
        const day = (anchor - offsetRef.current) / ppdRef.current;
        ppdRef.current = scale;
        offsetRef.current = clampOffset(anchor - day * scale, scale);
        setPpd(scale);
      };
      cancelAnimationFrame(zoomAnimRef.current);
      if (!animate || reducedMotion) {
        apply(next);
        return;
      }
      const from = ppdRef.current;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 240);
        const eased = 1 - Math.pow(1 - t, 3);
        apply(from * Math.pow(next / from, eased));
        if (t < 1) zoomAnimRef.current = requestAnimationFrame(step);
      };
      zoomAnimRef.current = requestAnimationFrame(step);
    },
    [layout, minPpd, clampOffset, reducedMotion],
  );

  const panBy = useCallback(
    (dx: number, animate = false) => {
      interactedRef.current = true;
      cancelAnimationFrame(inertiaRef.current);
      const target = clampOffset(offsetRef.current + dx);
      if (!animate || reducedMotion) {
        applyOffset(target);
        return;
      }
      const from = offsetRef.current;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 200);
        applyOffset(from + (target - from) * (1 - Math.pow(1 - t, 3)));
        if (t < 1) inertiaRef.current = requestAnimationFrame(step);
      };
      inertiaRef.current = requestAnimationFrame(step);
    },
    [clampOffset, applyOffset, reducedMotion],
  );

  const reset = useCallback(() => {
    if (!layout) return;
    stopMotion();
    interactedRef.current = false;
    const home = homeView(layout);
    ppdRef.current = home.scale;
    setPpd(home.scale);
    applyOffset(Math.min(0, Math.max(layout.width - TOTAL_DAYS * home.scale, home.offset)));
  }, [layout, homeView, applyOffset]);

  // Wheel: a plain vertical wheel always scrolls the page. Only a horizontal
  // gesture pans, and only ctrl/cmd + wheel zooms.
  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const rect = field.getBoundingClientRect();
        zoomTo(ppdRef.current * Math.exp(-event.deltaY * 0.0022), event.clientX - rect.left);
        return;
      }
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY) * 1.2) {
        event.preventDefault();
        panBy(-event.deltaX);
      }
    };
    field.addEventListener("wheel", onWheel, { passive: false });
    return () => field.removeEventListener("wheel", onWheel);
  }, [zoomTo, panBy]);

  useEffect(() => () => stopMotion(), []);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    stopMotion();
    dragRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startOffset: offsetRef.current,
      lastX: event.clientX,
      lastT: event.timeStamp,
      velocity: 0,
      moved: false,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    if (!drag.moved) {
      if (Math.abs(dx) < 4) return;
      drag.moved = true;
      interactedRef.current = true;
      setDragging(true);
      setHover(null);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const dt = Math.max(1, event.timeStamp - drag.lastT);
    drag.velocity = drag.velocity * 0.6 + ((event.clientX - drag.lastX) / dt) * 0.4;
    drag.lastX = event.clientX;
    drag.lastT = event.timeStamp;
    applyOffset(clampOffset(drag.startOffset + dx));
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    if (!drag.moved) return;
    setDragging(false);
    if (reducedMotion || event.type === "pointercancel") return;
    // A pause before release means no throw.
    let velocity = event.timeStamp - drag.lastT > 80 ? 0 : drag.velocity * 16;
    const glide = () => {
      velocity *= 0.92;
      if (Math.abs(velocity) < 0.3) return;
      const next = clampOffset(offsetRef.current + velocity);
      if (next === offsetRef.current) return;
      applyOffset(next);
      inertiaRef.current = requestAnimationFrame(glide);
    };
    inertiaRef.current = requestAnimationFrame(glide);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 480 : 140;
    switch (event.key) {
      case "ArrowLeft":
        panBy(step, true);
        break;
      case "ArrowRight":
        panBy(-step, true);
        break;
      case "+":
      case "=":
        zoomTo(ppdRef.current * ZOOM_STEP, undefined, true);
        break;
      case "-":
      case "_":
        zoomTo(ppdRef.current / ZOOM_STEP, undefined, true);
        break;
      case "0":
      case "Home":
        reset();
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  // Vertical layout of the board.
  const compact = layout?.compact ?? false;
  const height = layout?.height ?? 600;
  const axisHeight = compact ? 52 : 64;
  const firstLane = axisHeight + (compact ? 70 : 96);
  const lastLane = height - (compact ? 104 : 54);
  const visibleLanes = compact ? compactLanes : lanes;
  const laneGap = (lastLane - firstLane) / Math.max(1, visibleLanes.length - 1);
  const laneY = (index: number) => Math.round(firstLane + index * laneGap);
  const metrics: LabelMetrics = compact
    ? { fontSize: 10, height: 20, chrome: 14 }
    : { fontSize: 11.5, height: 23, chrome: 18 };

  const worldWidth = Math.ceil(TOTAL_DAYS * ppd);
  const nowX = AS_OF_DAY * ppd;

  const laneModels = useMemo(
    () =>
      visibleLanes.map((lane) => {
        const xs = lane.releases.map((r) => dayOf(r.date) * ppd);
        const placements = placeLabels(
          xs,
          lane.releases.map((r) => r.name),
          metrics,
        );
        return { lane, xs, placements };
      }),
    [ppd, compact, fontsReady],
  );

  const sliderValue = Math.round(
    (Math.log(ppd / minPpd) / Math.log(MAX_PPD / minPpd)) * 100,
  );

  const tooltip = (() => {
    if (!hover || dragging) return null;
    const { lane, xs } = laneModels[hover.lane];
    const release = lane.releases[hover.index];
    const previous = lane.releases[hover.index - 1];
    if (hover.kind === "gap" && previous && release.gap !== undefined) {
      return {
        x: (xs[hover.index - 1] + xs[hover.index]) / 2,
        y: laneY(hover.lane),
        accent: lane.accent,
        eyebrow: `${previous.name} → ${release.name}`,
        title: `${release.gap} days`,
        lines: [`${formatDate(previous.date)} – ${formatDate(release.date)}`, cadence(release.gap, lane.averageGap)],
      };
    }
    return {
      x: xs[hover.index],
      y: laneY(hover.lane),
      accent: lane.accent,
      eyebrow: `${lane.company} · ${lane.label}`,
      title: release.name,
      lines: [
        formatDate(release.date),
        previous && release.gap !== undefined
          ? release.gap === 0
            ? `Same day as ${previous.name}`
            : `${release.gap} ${release.gap === 1 ? "day" : "days"} after ${previous.name}`
          : null,
      ],
    };
  })();

  return (
    <div
      ref={rootRef}
      className={`tlm${compact ? " tlm--compact" : ""}${grid ? "" : " tlm--no-grid"}`}
    >
      <div ref={cardRef} className="tlm-card">
        <h3 id="ai-timeline-title">AI Timeline</h3>
        <p className="meta">Live at dreamatron.ai, 2026</p>
        <p>
          A map of AI progress, from model releases and generative media to voice, world models,
          coding tools and robotics. The board pans like a canvas with a zoom rail, and every gap
          is measured against its line’s average. It grew out of my earlier{" "}
          <Link to="/portfolio?project=ai-model-timeline">model timeline</Link>.
        </p>
        <a
          className="text-link"
          href="https://www.dreamatron.ai/timeline"
          target="_blank"
          rel="noreferrer"
        >
          Open the timeline
        </a>
      </div>
      <div
        ref={fieldRef}
        className={`tlm-field${dragging ? " is-dragging" : ""}`}
        role="region"
        aria-roledescription="timeline"
        aria-label="Interactive AI release timeline"
        aria-describedby="tlm-help"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => setHover(null)}
      >
        <SmokeField
          lanes={
            layout
              ? visibleLanes.map((lane, i) => ({
                  y: laneY(i),
                  color: lane.accent,
                  start: dayOf(lane.releases[0].date) * ppd,
                }))
              : []
          }
          offsetRef={offsetRef}
          nowX={nowX}
          shadeRef={cardRef}
          axisHeight={axisHeight}
        />
        <p id="tlm-help" className="tlm-sr">
          Drag or use the arrow keys to pan. Plus and minus zoom, zero resets. A snapshot of
          GPT, Claude, Gemini, Grok and Muse Spark releases as of {AS_OF_LABEL}.
        </p>

        {layout ? (
          <div
            ref={worldRef}
            className="tlm-world"
            style={{ width: worldWidth }}
            aria-hidden="true"
          >
            <svg className="tlm-lines" width={worldWidth} height={height}>
              {monthTicks.map((tick) => (
                <line
                  key={tick.day}
                  className={tick.month === 0 ? "tlm-grid-year" : "tlm-grid-month"}
                  x1={Math.round(tick.day * ppd) + 0.5}
                  x2={Math.round(tick.day * ppd) + 0.5}
                  y1={tick.month === 0 ? 34 : axisHeight - 6}
                  y2={height}
                />
              ))}
              {laneModels.map(({ lane, xs }, laneIndex) => {
                const y = laneY(laneIndex) + 0.5;
                const lastX = xs[xs.length - 1];
                return (
                  <g key={lane.id}>
                    <line className="tlm-track" x1={0} x2={worldWidth} y1={y} y2={y} />
                    {xs.slice(1).map((x, i) => (
                      <line
                        key={i}
                        className="tlm-connector"
                        stroke={lane.accent}
                        x1={Math.max(0, xs[i])}
                        x2={x}
                        y1={y}
                        y2={y}
                      />
                    ))}
                    {lastX < nowX ? (
                      <line
                        className="tlm-quiet"
                        stroke={lane.accent}
                        x1={lastX}
                        x2={nowX}
                        y1={y}
                        y2={y}
                      />
                    ) : null}
                  </g>
                );
              })}
              <line className="tlm-now" x1={nowX} x2={nowX} y1={axisHeight - 6} y2={height} />
            </svg>

            {monthTicks.map((tick) =>
              tick.month === 0 ? (
                <span
                  key={tick.day}
                  className="tlm-year"
                  style={{ left: tick.day * ppd, top: compact ? 12 : 16 }}
                >
                  {tick.year}
                </span>
              ) : ppd * 30 >= (compact ? 34 : 40) || tick.month % 3 === 0 ? (
                <span
                  key={tick.day}
                  className="tlm-month"
                  style={{ left: tick.day * ppd, top: axisHeight - 22 }}
                >
                  {MONTHS[tick.month]}
                </span>
              ) : null,
            )}

            {laneModels.map(({ lane, xs, placements }, laneIndex) => {
              const y = laneY(laneIndex);
              const last = lane.releases.length - 1;
              const quietDays = AS_OF_DAY - dayOf(lane.releases[last].date);
              return (
                <div key={lane.id} className="tlm-lane" style={{ ["--accent" as string]: lane.accent }}>
                  {lane.releases.map((release, i) => {
                    const x = xs[i];
                    if (i === 0 || release.gap === undefined) return null;
                    const width = x - Math.max(0, xs[i - 1]);
                    if (width < (compact ? 38 : 44)) return null;
                    return (
                      <span
                        key={`gap-${release.name}`}
                        className={`tlm-gap${
                          hover?.kind === "gap" && hover.lane === laneIndex && hover.index === i
                            ? " is-hover"
                            : ""
                        }`}
                        style={{ left: Math.max(0, xs[i - 1]) + width / 2, top: y }}
                        onPointerEnter={() =>
                          !dragRef.current?.moved && setHover({ lane: laneIndex, index: i, kind: "gap" })
                        }
                        onPointerLeave={() => setHover(null)}
                      >
                        {release.gap}D
                      </span>
                    );
                  })}

                  {lane.releases.map((release, i) => {
                    const x = xs[i];
                    if (x < 0) return null;
                    const placement = placements[i];
                    const latest = i === last;
                    const isHover =
                      hover?.kind === "release" && hover.lane === laneIndex && hover.index === i;
                    const mix = latest ? 0.12 : release.landmark ? 0.08 : 0;
                    return (
                      <div
                        key={release.name}
                        className={`tlm-release${latest ? " is-latest" : ""}${
                          release.landmark ? " is-landmark" : ""
                        }${isHover ? " is-hover" : ""}`}
                        style={{ left: x, top: y, zIndex: isHover ? 60 : 20 + i }}
                      >
                        {placement.leader ? (
                          <span className="tlm-leader" style={{ height: placement.leader }} />
                        ) : null}
                        {release.landmark ? <span className="tlm-aura" /> : null}
                        <span
                          className={`tlm-pin${lane.marker === "diamond" ? " tlm-pin--diamond" : ""}`}
                          onPointerEnter={() =>
                            !dragRef.current?.moved &&
                            setHover({ lane: laneIndex, index: i, kind: "release" })
                          }
                          onPointerLeave={() => setHover(null)}
                        />
                        <span
                          className="tlm-label"
                          style={{
                            left: ANCHOR_X + placement.shiftX,
                            bottom: ANCHOR_Y + placement.lift,
                            color: towardWhite(lane.accent, latest ? 0.12 : 0.24),
                            borderColor: rgba(lane.accent, latest ? 0.52 : 0.34),
                            backgroundColor: mix
                              ? `color-mix(in srgb, ${lane.accent} ${mix * 100}%, #0e121a)`
                              : undefined,
                          }}
                          onPointerEnter={() =>
                            !dragRef.current?.moved &&
                            setHover({ lane: laneIndex, index: i, kind: "release" })
                          }
                          onPointerLeave={() => setHover(null)}
                        >
                          {release.name}
                        </span>
                      </div>
                    );
                  })}

                  <span className="tlm-tail" style={{ left: nowX, top: y }}>
                    {quietDays > 0 ? <span className="tlm-quiet-pill">+{quietDays}D</span> : null}
                    <span className="tlm-lane-name">{lane.label}</span>
                  </span>
                </div>
              );
            })}

            {tooltip ? (
              <div
                className="tlm-tip"
                style={{ left: tooltip.x, top: tooltip.y, ["--accent" as string]: tooltip.accent }}
              >
                <span className="tlm-tip-eyebrow">{tooltip.eyebrow}</span>
                <span className="tlm-tip-title">{tooltip.title}</span>
                {tooltip.lines.filter(Boolean).map((line) => (
                  <span key={line} className="tlm-tip-line">
                    {line}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <p className="tlm-hint" aria-hidden="true">
          <span>Snapshot {AS_OF_LABEL}</span>
          <span className="tlm-hint-dot">·</span>
          <span>{compact ? "Swipe" : "Drag"} to pan</span>
        </p>
      </div>

      <div className="tlm-controls">
        <div className="tlm-rail" role="group" aria-label="Zoom">
          <button
            type="button"
            className="tlm-icon-button"
            aria-label="Zoom in"
            onClick={() => zoomTo(ppdRef.current * ZOOM_STEP, undefined, true)}
            disabled={ppd >= MAX_PPD - 0.001}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 3.5v9M3.5 8h9" />
            </svg>
          </button>
          <input
            className="tlm-slider"
            type="range"
            min={0}
            max={100}
            step={1}
            value={Number.isFinite(sliderValue) ? sliderValue : 0}
            aria-label="Zoom level"
            aria-valuetext={`${Math.round(ppd * 30)} pixels per month`}
            onChange={(event) =>
              zoomTo(minPpd * Math.pow(MAX_PPD / minPpd, Number(event.target.value) / 100))
            }
          />
          <button
            type="button"
            className="tlm-icon-button"
            aria-label="Zoom out"
            onClick={() => zoomTo(ppdRef.current / ZOOM_STEP, undefined, true)}
            disabled={ppd <= minPpd + 0.001}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3.5 8h9" />
            </svg>
          </button>
        </div>
        <div className="tlm-actions">
          <button
            type="button"
            className="tlm-button"
            aria-pressed={grid}
            onClick={() => setGrid((value) => !value)}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M5.5 2.5v11M10.5 2.5v11M2.5 5.5h11M2.5 10.5h11" />
            </svg>
            Grid
          </button>
          <button type="button" className="tlm-button" onClick={reset}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 8a5 5 0 1 0 1.6-3.7M3 2.8v2.6h2.6" />
            </svg>
            Reset
          </button>
        </div>
      </div>

    </div>
  );
}
