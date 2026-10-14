import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./PaintingLoupe.css";

/** Loupe diameter in CSS pixels. */
const SIZE = 200;
/** Magnification relative to the painting as it is shown on the page. */
const MAX_ZOOM = 3;
const MIN_ZOOM = 2;
/** Never enlarge past this multiple of the file's own pixels, so strokes stay sharp. */
const MAX_NATIVE = 1.25;

/**
 * Wraps a set of painting links (PaintingRows) and, on devices with a fine
 * pointer, shows a circular magnifier over the painting under the cursor so the
 * brushwork can be seen up close. It reuses the image already on the page, so
 * nothing extra is downloaded. Purely additive: links, focus and touch are untouched.
 */
export default function PaintingLoupe({ children }: { children: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const loupeRef = useRef<HTMLDivElement>(null);
  const lensImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const loupe = loupeRef.current;
    const lensImg = lensImgRef.current;
    if (!wrap || !loupe || !lensImg) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    let target: HTMLImageElement | null = null;
    let pointerX = 0;
    let pointerY = 0;
    let x = 0;
    let y = 0;
    let frame = 0;
    let hideTimer = 0;

    const findImage = (el: Element | null) => {
      const link = el?.closest<HTMLElement>(".painting-link");
      if (!link || !wrap.contains(link)) return null;
      return link.querySelector<HTMLImageElement>("img");
    };

    const draw = () => {
      frame = 0;
      if (!target) return;
      // A light ease gives the lens a little weight; reduced motion follows exactly.
      const k = still.matches ? 1 : 0.38;
      x += (pointerX - x) * k;
      y += (pointerY - y) * k;

      const rect = target.getBoundingClientRect();
      const natW = target.naturalWidth || rect.width;
      const natH = target.naturalHeight || rect.height;
      // The tiles use object-fit: cover, so map through the cover scale and crop.
      const cover = Math.max(rect.width / natW, rect.height / natH);
      const shownW = natW * cover;
      const shownH = natH * cover;
      const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, MAX_NATIVE / cover));
      const u = x - rect.left + (shownW - rect.width) / 2;
      const v = y - rect.top + (shownH - rect.height) / 2;

      lensImg.style.width = `${shownW * zoom}px`;
      lensImg.style.height = `${shownH * zoom}px`;
      lensImg.style.transform = `translate3d(${SIZE / 2 - u * zoom}px, ${SIZE / 2 - v * zoom}px, 0)`;
      loupe.style.transform = `translate3d(${x - SIZE / 2}px, ${y - SIZE / 2}px, 0)`;

      if (Math.abs(pointerX - x) > 0.3 || Math.abs(pointerY - y) > 0.3) {
        frame = requestAnimationFrame(draw);
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };

    const show = (img: HTMLImageElement) => {
      const src = img.currentSrc || img.src;
      if (lensImg.getAttribute("src") !== src) lensImg.src = src;
      if (!target) {
        // Start from the pointer so the lens never sweeps in from elsewhere.
        x = pointerX;
        y = pointerY;
      }
      target = img;
      wrap.classList.add("is-looking");
      loupe.classList.add("is-on");
      schedule();
    };

    const hide = () => {
      window.clearTimeout(hideTimer);
      hideTimer = 0;
      target = null;
      wrap.classList.remove("is-looking");
      loupe.classList.remove("is-on");
    };

    const update = (el: Element | null) => {
      const img = findImage(el);
      if (img && img.complete && img.naturalWidth > 0) {
        window.clearTimeout(hideTimer);
        hideTimer = 0;
        show(img);
      } else if (target && !hideTimer) {
        // Crossing the gap between two paintings shouldn't blink the lens.
        hideTimer = window.setTimeout(hide, 110);
      }
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || !fine.matches) return hide();
      pointerX = event.clientX;
      pointerY = event.clientY;
      update(event.target as Element);
      schedule();
    };

    // The page can scroll under a resting pointer; re-check what it is over.
    const onScroll = () => {
      if (!target) return;
      update(document.elementFromPoint(pointerX, pointerY));
      schedule();
    };

    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", hide);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("blur", hide);
    fine.addEventListener("change", hide);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(hideTimer);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", hide);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", hide);
      fine.removeEventListener("change", hide);
    };
  }, []);

  return (
    <div ref={wrapRef} className="painting-loupe-area">
      {children}
      {createPortal(
        <div
          ref={loupeRef}
          className="painting-loupe"
          style={{ width: SIZE, height: SIZE }}
          aria-hidden="true"
        >
          <div className="painting-loupe-lens">
            <img ref={lensImgRef} alt="" decoding="async" />
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
