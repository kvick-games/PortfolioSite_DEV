import { type KeyboardEvent } from "react";
import { DONE, LAST_STEP, STEPS, type Step } from "./levelGenSteps";

/** A quest request re-running the steps whose output changed. */
export interface Rerun {
  steps: number[];
  /** Index into `steps`; equal to its length once finished. */
  index: number;
}

type State = "idle" | "active" | "done";

function stepState(step: Step, phase: number, rerun: Rerun | null) {
  if (rerun) {
    const running = rerun.index < rerun.steps.length;
    const inRun = rerun.steps.includes(step.n);
    return {
      state: (running && rerun.steps[rerun.index] === step.n ? "active" : "done") as State,
      rerun: inRun ? "in" : running ? "out" : undefined,
    };
  }
  const state: State = step.n === phase ? "active" : phase > step.n ? "done" : "idle";
  return { state, rerun: undefined };
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M5.5 3.6v8.8L12.4 8z" />
    </svg>
  );
}

/**
 * The pipeline as a row of nine steps (three rows of three on narrow
 * screens). Each step replays itself on the map; left and right arrows walk
 * through them.
 */
export default function LevelGenStepRail({
  phase,
  rerun,
  onJump,
  resumes = false,
  onReplay,
  onHover,
}: {
  phase: number;
  rerun: Rerun | null;
  onJump: (step: number) => void;
  /** After an edit, play carries on from the next step instead of starting over. */
  resumes?: boolean;
  onReplay: () => void;
  onHover: (step: Step | null) => void;
}) {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (!(event.target instanceof HTMLButtonElement) || !event.target.dataset.step) return;
    event.preventDefault();
    const current = Math.min(Math.max(phase, 1), LAST_STEP);
    const next = event.key === "ArrowRight" ? current + 1 : current - 1;
    if (next < 1 || next > LAST_STEP || (next === current && phase < DONE)) return;
    onJump(next);
    event.currentTarget
      .querySelector<HTMLButtonElement>(`[data-step="${next}"]`)
      ?.focus();
  };
  return (
    <div className="lg-steps" onKeyDown={onKeyDown}>
      <button
        type="button"
        className="lg-play"
        aria-label={resumes ? "Carry on from the next step" : "Replay every step from the start"}
        onClick={onReplay}
      >
        <PlayIcon />
      </button>
      <ol>
        {STEPS.map((step) => {
          const s = stepState(step, phase, rerun);
          return (
            <li key={step.n}>
              <button
                type="button"
                className="lg-step"
                data-step={step.n}
                data-state={s.state}
                data-rerun={s.rerun}
                aria-current={s.state === "active" ? "step" : undefined}
                aria-label={`Step ${step.n} of ${LAST_STEP}: ${step.label}. Replays this step.`}
                onClick={() => onJump(step.n)}
                onPointerEnter={(event) => event.pointerType === "mouse" && onHover(step)}
                onPointerLeave={(event) => event.pointerType === "mouse" && onHover(null)}
                onFocus={() => onHover(step)}
                onBlur={() => onHover(null)}
              >
                <span className="lg-step-n">{String(step.n).padStart(2, "0")}</span>
                <span className="lg-step-label">{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
