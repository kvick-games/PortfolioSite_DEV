import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import "./EwaCameras.css";

export interface CameraShot {
  src: string;
  alt: string;
}

const AUTO_CUT_MS = 5200;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * In-engine captures shown the way a fixed-camera horror game shows a room:
 * one locked-off angle at a time, joined by hard cuts. Moving the pointer
 * across the frame walks through the angles, so each fifth of the frame is
 * one camera; taps and the numbered buttons cut too. Left alone in view, it
 * cuts on its own every few seconds, unless the visitor prefers reduced
 * motion, in which case cuts are instant and only happen when asked for.
 */
export default function EwaCameras({
  shots,
  caption,
  className = "",
}: {
  shots: CameraShot[];
  caption: ReactNode;
  className?: string;
}) {
  const [active, setActive] = useState(0);
  const [cut, setCut] = useState(0);
  const [reduced, setReduced] = useState(prefersReducedMotion);
  const root = useRef<HTMLElement>(null);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const activeRef = useRef(0);
  const inView = useRef(false);
  const engaged = useRef(false);
  const lastCut = useRef(0);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const cutTo = useCallback(
    (index: number) => {
      const next = (index + shots.length) % shots.length;
      if (next === activeRef.current) return;
      activeRef.current = next;
      lastCut.current = performance.now();
      setActive(next);
      setCut((count) => count + 1);
    },
    [shots.length],
  );

  // Cut on its own while the frame is on screen and nobody is using it.
  useEffect(() => {
    const element = root.current;
    if (!element || reduced) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView.current = entry.isIntersecting;
        if (entry.isIntersecting) lastCut.current = performance.now();
      },
      { threshold: 0.5 },
    );
    observer.observe(element);
    const timer = window.setInterval(() => {
      if (!inView.current || engaged.current || document.hidden) return;
      if (performance.now() - lastCut.current < AUTO_CUT_MS) return;
      cutTo(activeRef.current + 1);
    }, 400);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [cutTo, reduced]);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    cutTo(Math.min(shots.length - 1, Math.max(0, Math.floor(x * shots.length))));
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") cutTo(activeRef.current + 1);
  };

  const select = (index: number) => {
    const next = (index + shots.length) % shots.length;
    cutTo(next);
    buttons.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowDown: active + 1,
      ArrowLeft: active - 1,
      ArrowUp: active - 1,
      Home: 0,
      End: shots.length - 1,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    select(keys[event.key]);
  };

  const engage = () => {
    engaged.current = true;
  };
  const release = () => {
    engaged.current = false;
    lastCut.current = performance.now();
  };

  return (
    <figure
      ref={root}
      className={`ewa-cams ${className}`}
      data-reveal
      onPointerEnter={engage}
      onPointerLeave={release}
      onFocus={engage}
      onBlur={release}
    >
      <div
        className="ewa-cams-frame"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {shots.map((shot, index) => (
          <img
            key={shot.src}
            src={shot.src}
            alt={index === active ? shot.alt : ""}
            aria-hidden={index === active ? undefined : true}
            className={index === active ? "is-live" : undefined}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ))}
        {!reduced && cut > 0 && (
          <span className="ewa-cams-cut" key={cut} aria-hidden="true" />
        )}
      </div>
      <figcaption>
        <span>{caption}</span>
        <div
          className="ewa-cams-switch"
          role="group"
          aria-label="Camera"
          onKeyDown={onKeyDown}
        >
          {shots.map((shot, index) => (
            <button
              key={shot.src}
              ref={(element) => {
                buttons.current[index] = element;
              }}
              type="button"
              aria-label={`Camera ${index + 1} of ${shots.length}`}
              aria-pressed={index === active}
              tabIndex={index === active ? 0 : -1}
              onClick={() => cutTo(index)}
            />
          ))}
        </div>
      </figcaption>
    </figure>
  );
}
