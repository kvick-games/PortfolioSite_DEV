import { useEffect, useRef } from "react";

export type SplashLayer = { src: string; depth: number };

/** How far the nearest layer travels with the pointer, as a share of the panel's width. */
const TRAVEL = 0.03;

/**
 * A layered picture for an open splash panel. The far plate holds still and
 * the layers above it shift sideways against the pointer, nearer layers
 * further, then settle back when it leaves. Sideways only, so a figure cut
 * off by the bottom edge never lifts off it. Reduced motion keeps the stack
 * still.
 */
export default function SplashLayers({
  layers,
  width,
  height,
}: {
  layers: SplashLayer[];
  width: number;
  height: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = ref.current;
    const stage = root?.closest<HTMLElement>(".splash-stage");
    if (!root || !stage) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const items = [...root.querySelectorAll<HTMLElement>("[data-depth]")];
    let target = 0;
    let now = 0;
    let frame = 0;

    const tick = () => {
      frame = 0;
      now += (target - now) * 0.07;
      const travel = root.clientWidth * TRAVEL;
      items.forEach((item) => {
        const shift = (now * Number(item.dataset.depth) * travel).toFixed(2);
        item.style.transform = `translate3d(${shift}px, 0, 0)`;
      });
      if (Math.abs(target - now) > 0.0005) frame = requestAnimationFrame(tick);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const move = (event: PointerEvent) => {
      if (!root.closest(".is-active")) {
        target = 0;
        return schedule();
      }
      const rect = root.getBoundingClientRect();
      // -1..1 across the open panel; layers move against the pointer.
      target = -Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
      schedule();
    };
    const leave = () => {
      target = 0;
      schedule();
    };

    stage.addEventListener("pointermove", move, { passive: true });
    stage.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <span ref={ref} className="splash-layers">
      {layers.map((layer) => (
        <img
          key={layer.src}
          className="splash-img"
          src={layer.src}
          alt=""
          width={width}
          height={height}
          decoding="async"
          data-depth={layer.depth || undefined}
        />
      ))}
    </span>
  );
}
