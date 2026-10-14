import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ArtPiece } from "../data/types";
import LoopVideo from "./LoopVideo";

const EASE = "cubic-bezier(0.2, 0.7, 0.1, 1)";

type Rect = { left: number; top: number; width: number; height: number };

/** The largest centred box that fits the painting, never past twice its own pixels. */
function fit(width: number, height: number): Rect {
  const scale = Math.min(
    (window.innerWidth * 0.88) / width,
    (window.innerHeight * 0.86) / height,
    2,
  );
  const w = width * scale;
  const h = height * scale;
  return { left: (window.innerWidth - w) / 2, top: (window.innerHeight - h) / 2, width: w, height: h };
}

/** The transform that makes the centred frame sit exactly over the thumbnail's slot. */
function toSlot(slot: DOMRect, frame: Rect) {
  return `translate(${slot.left - frame.left}px, ${slot.top - frame.top}px) scale(${
    slot.width / frame.width
  }, ${slot.height / frame.height})`;
}

/**
 * One painting lifted out of its slot and centred over a blurred, faded page,
 * with no text. A click anywhere or Esc sends it back into its slot. `slot` is
 * the thumbnail's link: it is hidden while the painting is out, and gets focus
 * back on close.
 */
export default function PaintingFocus({
  piece,
  width,
  height,
  slot,
  onClosed,
}: {
  piece: ArtPiece;
  width: number;
  height: number;
  slot: HTMLElement;
  onClosed: () => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState(() => fit(width, height));
  const rectRef = useRef(rect);
  rectRef.current = rect;
  const closing = useRef(false);
  const [still] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const close = () => {
    const frame = frameRef.current;
    const backdrop = backdropRef.current;
    if (closing.current || !frame || !backdrop) return;
    closing.current = true;
    // Measured now, so a resize while open still lands in the right place.
    const target = slot.getBoundingClientRect();
    const timing = { duration: still ? 150 : 480, easing: EASE, fill: "both" as const };
    // Without motion the two simply cross-fade, so the thumbnail is back at once.
    if (still) slot.style.removeProperty("visibility");
    const moves = [
      backdrop.animate([{ opacity: 1 }, { opacity: 0 }], timing),
      still
        ? frame.animate([{ opacity: 1 }, { opacity: 0 }], timing)
        : frame.animate(
            [{ transform: "none" }, { transform: toSlot(target, rectRef.current) }],
            timing,
          ),
    ];
    Promise.all(moves.map((move) => move.finished)).then(() => {
      slot.style.removeProperty("visibility");
      slot.focus({ preventScroll: true });
      onClosed();
    }, onClosed);
  };
  const closeRef = useRef(close);
  closeRef.current = close;

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const backdrop = backdropRef.current;
    if (!frame || !backdrop) return;
    const start = slot.getBoundingClientRect();
    slot.style.visibility = "hidden";
    const timing = { duration: still ? 150 : 500, easing: EASE, fill: "both" as const };
    backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { ...timing, duration: still ? 150 : 450 });
    if (still) frame.animate([{ opacity: 0 }, { opacity: 1 }], timing);
    else frame.animate([{ transform: toSlot(start, rectRef.current) }, { transform: "none" }], timing);
    frame.focus({ preventScroll: true });

    // Hold the page still, keeping the scrollbar's width so nothing shifts.
    const root = document.documentElement;
    const gutter = window.innerWidth - root.clientWidth;
    root.style.overflow = "hidden";
    document.body.style.paddingRight = gutter ? `${gutter}px` : "";
    return () => {
      root.style.removeProperty("overflow");
      document.body.style.removeProperty("padding-right");
      slot.style.removeProperty("visibility");
    };
  }, [slot, still]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      // The painting is the only thing in the dialog, so focus stays on it.
      if (event.key === "Tab") event.preventDefault();
    };
    const onResize = () => setRect(fit(width, height));
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [width, height]);

  return createPortal(
    <div className="painting-focus" onClick={close}>
      <div ref={backdropRef} className="painting-focus-backdrop" />
      <div
        ref={frameRef}
        className="painting-focus-frame"
        role="dialog"
        aria-modal="true"
        aria-label={piece.title}
        tabIndex={-1}
        style={rect}
      >
        <img src={piece.coverImage} alt="" width={width} height={height} />
        {piece.loop ? <LoopVideo src={piece.loop} /> : null}
      </div>
    </div>,
    document.body,
  );
}
