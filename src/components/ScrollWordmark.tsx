import { useEffect, useRef } from "react";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t * t;
const clamp = (t: number) => Math.min(1, Math.max(0, t));

/**
 * A branded name revealed one letter at a time as it scrolls into view: each
 * letter slides in from the left and fades up, first to last. As it scrolls
 * off the top they carry on to the right in the same order. The motion is
 * tied to scroll position, so it plays in both directions, and there is no
 * vertical movement.
 */
export default function ScrollWordmark({ name, id }: { name: string; id?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const heading = ref.current;
    if (!heading) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const letters = [...heading.querySelectorAll<HTMLElement>(".scroll-wordmark-letter")];
    // How many letters are moving at once: lower is more one-at-a-time.
    const overlap = 2.5;
    const span = letters.length - 1 + overlap;
    let travel = 0;
    let frame = 0;

    const measure = () => {
      travel = parseFloat(getComputedStyle(heading).fontSize) * 1.6;
    };

    // Letter i's share of an overall 0..1 progress, staggered first to last.
    const step = (progress: number, i: number) => clamp((progress * span - i) / overlap);

    const update = () => {
      frame = 0;
      const rect = heading.getBoundingClientRect();
      const vh = window.innerHeight;
      // In: from the top edge entering at the bottom, to 30% down the screen.
      const enter = clamp((vh * 0.98 - rect.top) / (vh * 0.68));
      // Out: from the top edge reaching 8% of the screen, to fully gone.
      const leave = clamp((vh * 0.08 - rect.top) / (vh * 0.08 + rect.height));
      letters.forEach((letter, i) => {
        const inT = easeOut(step(enter, i));
        const outT = easeIn(step(leave, i));
        const x = -(1 - inT) * travel + outT * travel;
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
