import { useEffect, useRef } from "react";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t * t;
const clamp = (t: number) => Math.min(1, Math.max(0, t));

/**
 * A branded name whose letters converge horizontally as it scrolls into view:
 * they start spread out past the edges and slide into their spaced positions,
 * fading up as they come. As it scrolls off the top they spread apart again.
 * The motion is tied to scroll position, so it plays in both directions, and
 * there is no vertical movement.
 */
export default function ScrollWordmark({ name, id }: { name: string; id?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const heading = ref.current;
    if (!heading) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const letters = [...heading.querySelectorAll<HTMLElement>(".scroll-wordmark-letter")];
    const middle = (letters.length - 1) / 2;
    let offsets: number[] = [];
    let frame = 0;

    // Each letter's distance from the centre of the word, measured at rest.
    const measure = () => {
      letters.forEach((letter) => (letter.style.transform = ""));
      const box = heading.getBoundingClientRect();
      const centre = box.left + box.width / 2;
      offsets = letters.map((letter) => {
        const rect = letter.getBoundingClientRect();
        return centre - (rect.left + rect.width / 2);
      });
    };

    const update = () => {
      frame = 0;
      const rect = heading.getBoundingClientRect();
      const vh = window.innerHeight;
      // In: from the top edge entering at the bottom, to 60% up the screen.
      const enter = clamp((vh - rect.top) / (vh * 0.4));
      // Out: from the top edge reaching 10% of the screen, to fully gone.
      const leave = clamp((vh * 0.1 - rect.top) / (vh * 0.1 + rect.height));
      letters.forEach((letter, i) => {
        // Outer letters have further to travel, so they start a little earlier.
        const reach = Math.abs(i - middle) / middle;
        const inT = easeOut(clamp((enter - (1 - reach) * 0.25) / 0.75));
        const outT = easeIn(clamp((leave - (1 - reach) * 0.2) / 0.8));
        const spread = (1 - inT) * 1.4 + outT * 1.4;
        const x = -offsets[i] * spread;
        letter.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
        letter.style.opacity = (inT * (1 - outT)).toFixed(3);
      });
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const resize = () => {
      measure();
      update();
    };

    resize();
    heading.classList.add("is-scroll-driven");
    document.fonts?.ready.then(resize);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", resize);
      heading.classList.remove("is-scroll-driven");
      letters.forEach((letter) => {
        letter.style.transform = "";
        letter.style.opacity = "";
      });
    };
  }, [name]);

  return (
    <h2 id={id} ref={ref} className="wordmark-giant scroll-wordmark">
      <span className="brand">
        <span className="sr-only">{name}</span>
        <span aria-hidden="true">
          {[...name].map((char, i) => (
            <span key={i} className="scroll-wordmark-letter">
              {char}
            </span>
          ))}
        </span>
      </span>
    </h2>
  );
}
