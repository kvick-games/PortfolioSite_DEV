import { type CSSProperties, type KeyboardEvent } from "react";
import {
  DONE,
  EDGES,
  GRAPH_H,
  GRAPH_W,
  LAST_STEP,
  MILESTONES,
  NODE,
  NODES,
  PLAYHEAD,
  ROWS,
  TIMELINE,
  pathOf,
  portOf,
  type PipeEdge,
  type PipeNode,
  type Port,
  type RowItem,
} from "./levelGenGraph";

/** A quest request re-running part of the pipeline. */
export interface Rerun {
  nodes: Set<string>;
  phases: number[];
  /** Index into `phases`; equal to its length once finished. */
  index: number;
}

export interface PipelineProps {
  phase: number;
  rerun: Rerun | null;
  /** The node under the pointer or keyboard focus. */
  hover: string | null;
  onSelect: (node: PipeNode) => void;
  onJump: (phase: number) => void;
  onReplay: () => void;
  onHover: (node: PipeNode | null) => void;
}

type State = "idle" | "active" | "done";

const pct = (v: number, of: number) => `${(v / of) * 100}%`;
const vars = (v: Record<string, string | number>) => v as CSSProperties;

function nodeState(node: PipeNode, phase: number, rerun: Rerun | null) {
  if (rerun) {
    const running = rerun.index < rerun.phases.length;
    const op = rerun.phases[rerun.index];
    const inRun = rerun.nodes.has(node.id);
    return {
      state: (running && inRun && node.phases.includes(op) ? "active" : "done") as State,
      rerun: inRun ? "in" : running ? "out" : undefined,
      consulted: running && node.consulted?.includes(op),
    };
  }
  const state: State = node.phases.includes(phase)
    ? "active"
    : phase > node.phases[0]
      ? "done"
      : "idle";
  return { state, rerun: undefined, consulted: node.consulted?.includes(phase) };
}

function edgeState(edge: PipeEdge, phase: number, rerun: Rerun | null): { state: State; out?: boolean } {
  if (rerun) {
    const running = rerun.index < rerun.phases.length;
    const inRun = rerun.nodes.has(edge.from) && rerun.nodes.has(edge.to);
    if (running && inRun && edge.phase === rerun.phases[rerun.index]) return { state: "active" };
    return { state: "done", out: running && !inRun };
  }
  return { state: edge.phase === phase ? "active" : phase > edge.phase ? "done" : "idle" };
}

/** How a node or edge relates to the hovered node. */
function nodeRel(id: string, hover: string | null) {
  if (!hover) return undefined;
  if (id === hover) return "self";
  if (EDGES.some((e) => e.from === id && e.to === hover)) return "up";
  if (EDGES.some((e) => e.from === hover && e.to === id)) return "down";
  return "none";
}
function edgeRel(edge: PipeEdge, hover: string | null) {
  if (!hover) return undefined;
  if (edge.to === hover) return "up";
  if (edge.from === hover) return "down";
  return "none";
}

const length = (pts: Array<[number, number]>) =>
  pts.reduce((sum, [x, y], i) => (i ? sum + Math.abs(x - pts[i - 1][0]) + Math.abs(y - pts[i - 1][1]) : 0), 0);

function NodeButton({
  node,
  phase,
  rerun,
  hover,
  onSelect,
  onHover,
  placed,
}: Pick<PipelineProps, "phase" | "rerun" | "hover" | "onSelect" | "onHover"> & {
  node: PipeNode;
  placed: boolean;
}) {
  const s = nodeState(node, phase, rerun);
  const style = placed
    ? vars({
        left: pct(node.x, GRAPH_W),
        top: pct(node.y, GRAPH_H),
        width: pct(node.w, GRAPH_W),
        height: pct(node.h, GRAPH_H),
        "--d": node.at,
      })
    : vars({ "--d": node.at });
  const label = node.label2 ? `${node.label} ${node.label2}` : node.label;
  return (
    <button
      type="button"
      className={placed ? "lg-node" : "lg-node lg-chip"}
      data-role={node.role}
      data-state={s.state}
      data-rerun={s.rerun}
      data-consulted={s.consulted || undefined}
      data-rel={nodeRel(node.id, hover)}
      data-produces={node.produces.join(" ") || undefined}
      style={style}
      aria-label={`${label}. ${node.about} Replays step ${node.phases[0]} of ${LAST_STEP}.`}
      aria-current={s.state === "active" ? "step" : undefined}
      onClick={() => onSelect(node)}
      onPointerEnter={(event) => event.pointerType === "mouse" && onHover(node)}
      onPointerLeave={(event) => event.pointerType === "mouse" && onHover(null)}
      onFocus={() => onHover(node)}
      onBlur={() => onHover(null)}
    >
      <span>
        {node.label}
        {node.label2 ? (
          <>
            {placed ? <br /> : " "}
            {node.label2}
          </>
        ) : null}
      </span>
    </button>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M5.5 3.6v8.8L12.4 8z" />
    </svg>
  );
}

/** Left and right arrows step through the phases from any node. */
const stepKeys = (phase: number, onJump: (p: number) => void) => (event: KeyboardEvent) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  if (!(event.target instanceof HTMLButtonElement)) return;
  event.preventDefault();
  const current = Math.min(Math.max(phase, 1), LAST_STEP);
  const next = event.key === "ArrowRight" ? current + 1 : current - 1;
  if (next >= 1 && next <= LAST_STEP && (next !== current || phase >= DONE)) onJump(next);
};

/** The node graph, laid out like the real diagram. */
export function PipelineGraph(props: PipelineProps) {
  const { phase, rerun, hover, onReplay, onJump } = props;
  const head = rerun ? PLAYHEAD[DONE] : PLAYHEAD[Math.min(phase, DONE)];
  const span = TIMELINE.x2 - TIMELINE.x1;
  return (
    <div
      className="lg-graph"
      data-hovering={hover ? true : undefined}
      style={{ aspectRatio: `${GRAPH_W} / ${GRAPH_H}` }}
      onKeyDown={stepKeys(phase, onJump)}
    >
      <svg className="lg-wires" viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`} aria-hidden="true">
        <g className="lg-timeline">
          <text className="lg-timeline-title" x={36} y={27}>
            Pipeline
          </text>
          <line className="lg-timeline-base" x1={TIMELINE.x1} y1={TIMELINE.y} x2={TIMELINE.x2 - 4} y2={TIMELINE.y} />
          <rect
            className="lg-timeline-progress"
            x={TIMELINE.x1}
            y={TIMELINE.y - 0.75}
            width={span}
            height={1.5}
            style={{ transform: `scaleX(${(head - TIMELINE.x1) / span})` }}
          />
          <path
            className="lg-timeline-end"
            data-reached={phase >= DONE || rerun ? true : undefined}
            d={`M${TIMELINE.x2} ${TIMELINE.y}l-7 -4v8z`}
          />
          {MILESTONES.map((m) => (
            <g
              key={m.x}
              className="lg-milestone"
              data-reached={phase >= m.phase || rerun ? true : undefined}
              data-current={!rerun && phase === m.phase ? true : undefined}
            >
              <path d={`M${m.x - 6} ${TIMELINE.y}l-7 -4v8z`} />
              <circle cx={m.x} cy={TIMELINE.y} r={5} />
            </g>
          ))}
          <circle
            className="lg-timeline-head"
            cx={0}
            cy={TIMELINE.y}
            r={3}
            style={{ transform: `translateX(${head}px)` }}
          />
        </g>
        {EDGES.map((edge) => {
          const s = edgeState(edge, phase, rerun);
          const port = portOf(edge);
          const len = length(edge.pts);
          return (
            <g
              key={edge.id}
              className="lg-edge"
              data-state={s.state}
              data-out={s.out || undefined}
              data-rel={edgeRel(edge, hover)}
              style={vars({ "--d": edge.at, "--len": len, "--dur": `${Math.round(Math.max(420, len * 2.6))}ms` })}
            >
              <path className="lg-wire" d={pathOf(edge.pts)} />
              <path className="lg-pulse" d={pathOf(edge.pts)} />
              {port.kind === "dot" ? (
                <circle className="lg-port" cx={port.x} cy={port.y} r={3.4} />
              ) : (
                <path className="lg-port" d={port.d} />
              )}
            </g>
          );
        })}
        {EDGES.filter((edge) => edge.label).map((edge) => {
          const label = edge.label!;
          const w = label.text.length * 5.3 + 8;
          return (
            <g key={`${edge.id}-label`} className="lg-edge-label">
              <rect x={label.x - w / 2} y={label.y - 7} width={w} height={14} rx={2} />
              <text x={label.x} y={label.y + 3.4}>
                {label.text}
              </text>
            </g>
          );
        })}
        <g className="lg-legend" transform="translate(252 318)">
          <rect className="lg-legend-actor" x={0} y={0} width={14} height={10} rx={2.5} />
          <text x={20} y={9}>
            Actor
          </text>
          <rect className="lg-legend-fn" x={62} y={0} width={14} height={10} rx={2.5} />
          <text x={82} y={9}>
            Function
          </text>
          <rect className="lg-legend-data" x={138} y={0} width={14} height={10} rx={2.5} />
          <text x={158} y={9}>
            Data
          </text>
        </g>
      </svg>
      <button
        type="button"
        className="lg-play"
        style={{ left: pct(4, GRAPH_W), top: pct(TIMELINE.y - 12, GRAPH_H), width: pct(24, GRAPH_W) }}
        aria-label="Replay the pipeline from the start"
        onClick={onReplay}
      >
        <PlayIcon />
      </button>
      {MILESTONES.map((m) => (
        <button
          key={m.x}
          type="button"
          className="lg-milestone-hit"
          style={{ left: pct(m.x - 9, GRAPH_W), top: pct(TIMELINE.y - 9, GRAPH_H), width: pct(18, GRAPH_W) }}
          aria-label={`Timeline: jump to ${m.label}`}
          onClick={() => onJump(m.phase)}
        />
      ))}
      {NODES.map((node) => (
        <NodeButton key={node.id} node={node} placed {...props} />
      ))}
      <svg className="lg-traces" viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`} aria-hidden="true">
        {NODES.map((node) => {
          const s = nodeState(node, phase, rerun);
          return (
            <rect
              key={`${node.id}-${s.state === "active" ? phase : "x"}`}
              className="lg-trace"
              data-state={s.state}
              x={node.x - 3}
              y={node.y - 3}
              width={node.w + 6}
              height={node.h + 6}
              rx={9}
              pathLength={1}
              style={vars({ "--d": node.at })}
            />
          );
        })}
      </svg>
    </div>
  );
}

function PortGlyph({ port }: { port: Port }) {
  return (
    <svg className="lg-chip-port" viewBox="0 0 18 10" aria-hidden="true">
      <path d="M0 5H12" />
      {port === "arrow" ? <path className="lg-chip-mark" d="M18 5l-7 -4v8z" /> : null}
      {port === "diamond" ? <path className="lg-chip-mark" d="M14 1l4 4l-4 4l-4 -4z" /> : null}
      {port === "dot" ? <circle className="lg-chip-mark" cx="14.5" cy="5" r="3.2" /> : null}
    </svg>
  );
}

/** Ports and input names travel with the node after them, so a wrapped row
    never leaves an arrow dangling at the end of a line. */
function units(items: RowItem[]) {
  const out: RowItem[][] = [];
  let pending: RowItem[] = [];
  for (const item of items) {
    pending.push(item);
    if ("node" in item) {
      out.push(pending);
      pending = [];
    }
  }
  if (pending.length) out.push(pending);
  return out;
}

/** The phone form: one row per step, the same nodes as buttons. */
export function PipelineList(props: PipelineProps) {
  const { phase, rerun, onReplay, onJump } = props;
  return (
    <div className="lg-list" onKeyDown={stepKeys(phase, onJump)}>
      <div className="lg-list-head">
        <button
          type="button"
          className="lg-play lg-play--inline"
          aria-label="Replay the pipeline from the start"
          onClick={onReplay}
        >
          <PlayIcon />
        </button>
        <span>Pipeline</span>
      </div>
      <ol>
        {ROWS.map((row) => {
          const running = rerun && rerun.index < rerun.phases.length;
          const state = rerun
            ? running && rerun.phases[rerun.index] === row.phase
              ? "active"
              : "done"
            : row.phase === phase
              ? "active"
              : phase > row.phase
                ? "done"
                : "idle";
          return (
            <li
              key={row.phase}
              data-state={state}
              data-milestone={MILESTONES.some((m) => m.phase === row.phase) || undefined}
            >
              {units(row.items).map((unit, i) => (
                <span key={i} className="lg-unit">
                  {unit.map((item, j) =>
                    "node" in item ? (
                      <NodeButton key={j} node={NODE[item.node]} placed={false} {...props} />
                    ) : "text" in item ? (
                      <span key={j} className="lg-chip-text">
                        {item.text}
                      </span>
                    ) : (
                      <PortGlyph key={j} port={item.port} />
                    ),
                  )}
                </span>
              ))}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
