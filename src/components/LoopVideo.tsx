import { useEffect, useRef, useState } from "react";

/**
 * A muted loop laid over a painting's cover image, which stays underneath as
 * the poster. It loads the first time it nears the viewport, plays only while
 * on screen, and fades in once it is actually playing. If the file fails, or
 * the visitor prefers reduced motion, only the cover shows.
 */
export default function LoopVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [still] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!video.getAttribute("src")) video.src = src;
          video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [src, failed, still]);

  if (still || failed) return null;
  return (
    <video
      ref={videoRef}
      className={playing ? "loop-video is-playing" : "loop-video"}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      onPlaying={() => setPlaying(true)}
      onError={() => setFailed(true)}
    />
  );
}
