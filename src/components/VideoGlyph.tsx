import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from "react";
import "./video-control.css";

/**
 * The site's one video-control mark: a white play or pause glyph on a quiet
 * translucent disc. Purely visual; the button around it carries the label.
 * The two glyphs are stacked so a change of state crossfades.
 */
export default function VideoGlyph({
  playing = false,
  className = "",
}: {
  playing?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`video-glyph ${className}`.trim()}
      data-state={playing ? "playing" : "paused"}
      aria-hidden="true"
    >
      <svg className="video-glyph-play" viewBox="0 0 24 24">
        <path d="M8.5 6v12l9.5-6z" />
      </svg>
      <svg className="video-glyph-pause" viewBox="0 0 24 24">
        <path d="M7.5 6h3v12h-3zM13.5 6h3v12h-3z" />
      </svg>
    </span>
  );
}

/** m:ss, the way a player shows it. */
const clock = (seconds: number) => {
  const whole = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

type Scrub = {
  id: number;
  resume: boolean; // play again on release: it was playing when the drag began
  live: boolean; // a touch only scrubs once it moves sideways, or on a tap
  startX: number;
  time: number;
};

/**
 * The scrubber that goes with the glyph: a thin white line with the played
 * part filled and a small handle. Drag or click to seek; as a slider it takes
 * the arrow keys (1s, 5s with Shift), Page Up/Down (5s), Home and End.
 * A drag pauses the footage and resumes it on release if it was playing.
 * Progress is painted with transforms only, once a frame while playing.
 */
export function VideoSeek({
  video,
  label = "Footage position",
  className = "",
}: {
  video: RefObject<HTMLVideoElement | null>;
  label?: string;
  className?: string;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const scrub = useRef<Scrub | null>(null);
  const pending = useRef<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [second, setSecond] = useState(0);

  const paint = useCallback((time: number, total: number) => {
    const p = total > 0 ? clamp01(time / total) : 0;
    if (fillRef.current) fillRef.current.style.transform = `scaleX(${p})`;
    if (railRef.current) railRef.current.style.transform = `translateX(${p * 100}%)`;
    setSecond(Math.floor(time));
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let raf = 0;
    const total = () => (Number.isFinite(element.duration) ? element.duration : 0);
    const now = () => (scrub.current?.live ? scrub.current.time : element.currentTime);
    const render = () => paint(now(), total());
    const loop = () => {
      render();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      render();
    };
    const meta = () => {
      setDuration(total());
      render();
    };
    // Drag faster than the decoder: keep only the latest target.
    const seeked = () => {
      if (pending.current === null) return render();
      const next = pending.current;
      pending.current = null;
      element.currentTime = next;
    };
    element.addEventListener("loadedmetadata", meta);
    element.addEventListener("durationchange", meta);
    element.addEventListener("play", start);
    element.addEventListener("pause", stop);
    element.addEventListener("timeupdate", render);
    element.addEventListener("seeked", seeked);
    if (element.readyState >= 1) meta();
    if (!element.paused) start();
    return () => {
      cancelAnimationFrame(raf);
      element.removeEventListener("loadedmetadata", meta);
      element.removeEventListener("durationchange", meta);
      element.removeEventListener("play", start);
      element.removeEventListener("pause", stop);
      element.removeEventListener("timeupdate", render);
      element.removeEventListener("seeked", seeked);
    };
  }, [video, paint]);

  const seek = (time: number) => {
    const element = video.current;
    if (!element || !duration) return;
    // Stop a frame short of the end so a looping clip doesn't wrap to 0:00.
    const target = Math.min(Math.max(0, time), Math.max(0, duration - 0.04));
    if (scrub.current) scrub.current.time = target;
    if (element.seeking) pending.current = target;
    else element.currentTime = target;
    paint(target, duration);
  };

  const timeAt = (clientX: number) => {
    const box = sliderRef.current?.getBoundingClientRect();
    if (!box || !box.width) return 0;
    return clamp01((clientX - box.left) / box.width) * duration;
  };

  const begin = (state: Scrub) => {
    state.live = true;
    barRef.current?.setAttribute("data-scrubbing", "");
    video.current?.pause();
  };

  const end = (resume: boolean) => {
    const state = scrub.current;
    if (!state) return;
    scrub.current = null;
    barRef.current?.removeAttribute("data-scrubbing");
    if (resume && state.live && state.resume) {
      video.current?.play().catch(() => {});
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !duration || !video.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const state: Scrub = {
      id: event.pointerId,
      resume: !video.current.paused,
      live: false,
      startX: event.clientX,
      time: video.current.currentTime,
    };
    scrub.current = state;
    if (event.pointerType !== "touch") {
      begin(state);
      seek(timeAt(event.clientX));
    }
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = scrub.current;
    if (!state || state.id !== event.pointerId) return;
    if (!state.live) {
      if (Math.abs(event.clientX - state.startX) < 4) return;
      begin(state);
    }
    seek(timeAt(event.clientX));
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const state = scrub.current;
    if (!state || state.id !== event.pointerId) return;
    if (!state.live) {
      // A tap: seek there, and keep playing if it was.
      begin(state);
      seek(timeAt(event.clientX));
    }
    end(true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const element = video.current;
    if (!element || !duration) return;
    const big = event.shiftKey ? 5 : 1;
    const steps: Record<string, number> = {
      ArrowRight: big,
      ArrowUp: big,
      ArrowLeft: -big,
      ArrowDown: -big,
      PageUp: 5,
      PageDown: -5,
    };
    let target: number;
    if (event.key in steps) target = element.currentTime + steps[event.key];
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = duration;
    else return;
    event.preventDefault();
    seek(target);
  };

  const now = Math.min(second, Math.floor(duration));

  return (
    <div ref={barRef} className={`video-seek-bar ${className}`.trim()}>
      <div
        ref={sliderRef}
        className="video-seek"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={Math.floor(duration)}
        aria-valuenow={now}
        aria-valuetext={`${clock(now)} of ${clock(duration)}`}
        aria-disabled={duration ? undefined : true}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => end(true)}
        onLostPointerCapture={() => end(true)}
        onKeyDown={onKeyDown}
      >
        <span className="video-seek-track" aria-hidden="true">
          <span ref={fillRef} className="video-seek-fill" />
          <span ref={railRef} className="video-seek-rail">
            <span className="video-seek-thumb" />
          </span>
        </span>
      </div>
      {duration ? (
        <span className="video-seek-time" aria-hidden="true">
          {clock(now)} / {clock(duration)}
        </span>
      ) : null}
    </div>
  );
}
