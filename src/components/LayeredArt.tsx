import { Fragment, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import "./layered-art.css";

export interface ArtLayer {
  name: string;
  src: string;
  /** 0 is the far plate, which stays put; 1 is the nearest layer. */
  depth: number;
  /** A mask of the layer's edges; a slow highlight sweeps along them. */
  rim?: string;
}

/** How far the nearest layer travels across a full pass, as a share of the height. */
const RANGE = 0.07;
/** Depth of anything drawn between the plate and the layers above it. */
const BETWEEN_DEPTH = 0.4;

/**
 * A picture split into aligned layers that drift apart a little as it
 * scrolls past, nearer layers further, so it reads with depth. Every layer
 * is a full-frame image on the same canvas, so with no scroll they stack
 * back into the original picture. Layers drift vertically by default; a
 * figure cut off by the frame's bottom edge drifts sideways instead (axis
 * "x"), so no gap opens under it. Reduced motion shows the still stack.
 */
export default function LayeredArt({
  layers,
  width,
  height,
  alt,
  className,
  axis = "y",
  range = RANGE,
  between,
}: {
  layers: ArtLayer[];
  width: number;
  height: number;
  alt: string;
  className?: string;
  axis?: "x" | "y";
  /** Overrides RANGE; sideways drift reads larger, so it wants less. */
  range?: number;
  /** Drawn over the plate and under the other layers, drifting between them. */
  between?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const items = [...root.querySelectorAll<HTMLElement>(".layered-art-layer")];
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.bottom < -vh * 0.25 || rect.top > vh * 1.25) return;
      // -1 as the picture enters at the bottom, 0 centred, 1 leaving the top.
      const progress = Math.max(-1, Math.min(1, (vh / 2 - (rect.top + rect.height / 2)) / ((vh + rect.height) / 2)));
      const travel = rect.height * range;
      items.forEach((item) => {
        const depth = Number(item.dataset.depth);
        const shift = (-progress * depth * travel).toFixed(2);
        item.style.transform = axis === "x" ? `translate3d(${shift}px, 0, 0)` : `translate3d(0, ${shift}px, 0)`;
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [layers, axis, range]);

  return (
    <div
      ref={ref}
      className={`layered-art${className ? ` ${className}` : ""}`}
      role="img"
      aria-label={alt}
      style={{ "--ratio": `${width} / ${height}` } as CSSProperties}
    >
      {layers.map((layer, index) => (
        <Fragment key={layer.name}>
          <img
            className="layered-art-layer"
            data-depth={layer.depth}
            src={layer.src}
            alt=""
            width={width}
            height={height}
            decoding="async"
            fetchPriority={index === 0 ? "high" : undefined}
          />
          {index === 0 && between ? (
            <span className="layered-art-layer layered-art-between" data-depth={BETWEEN_DEPTH}>
              {between}
            </span>
          ) : null}
          {layer.rim ? (
            <span
              className="layered-art-layer layered-art-rim"
              data-depth={layer.depth}
              style={{ "--rim": `url("${layer.rim}")` } as CSSProperties}
              aria-hidden="true"
            />
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}
