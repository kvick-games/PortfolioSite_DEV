import { useLayoutEffect } from "react";
import { Navigate, Route, Routes, useLocation, Link } from "react-router-dom";
import Header from "./components/Header";
import { viewTransitionRunning } from "./components/TransitionRouter";
import { profiles } from "./data/site";
import AboutPage from "./pages/AboutPage";
import ArtPage from "./pages/ArtPage";
import PortfolioPage from "./pages/PortfolioPage";
import ProjectsPage from "./pages/ProjectsPage";

export default function App() {
  const location = useLocation();
  // A layout effect, so the scroll reset lands inside the page cross-fade
  // (TransitionRouter) rather than visibly before or after it.
  useLayoutEffect(() => {
    const target = location.hash
      ? document.getElementById(location.hash.slice(1))
      : null;
    if (target) target.scrollIntoView({ behavior: viewTransitionRunning() ? "instant" : "auto" });
    else window.scrollTo({ top: 0, behavior: "instant" });
    const titles: Record<string, string> = {
      "/portfolio": "Interfaces for games and creative tools",
      "/projects": "Experiments",
      "/art": "Paintings",
      "/about": "About",
    };
    document.title = `Michael Nevins | ${titles[location.pathname] ?? "Portfolio"}`;
    if (location.key !== "default" && !target)
      document
        .querySelector<HTMLElement>("main")
        ?.focus({ preventScroll: true });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.classList.add("motion");
    // Staggers siblings that enter together, so a section arrives heading first.
    const observer = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry, index) => {
            const element = entry.target as HTMLElement;
            element.style.setProperty("--delay", `${Math.min(index, 6) * 70}ms`);
            // Arriving from another page, the cross-fade is the reveal.
            if (viewTransitionRunning()) element.classList.add("reveal-now");
            element.classList.add("revealed");
            observer.unobserve(element);
          });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    document
      .querySelectorAll("[data-reveal]:not(.revealed), .article-section > *")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [location.pathname, location.search, location.hash, location.key]);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <Routes>
        <Route path="/" element={<Navigate to="/portfolio" replace />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/art" element={<ArtPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/portfolio" replace />} />
      </Routes>
      <footer className="site-footer">
        <nav className="footer-links" aria-label="Elsewhere">
          {profiles.map((profile) => (
            <a key={profile.href} href={profile.href} target="_blank" rel="noreferrer">
              {profile.label}
            </a>
          ))}
          <Link to="/projects">Experiments</Link>
        </nav>
        <Link className="footer-name" to="/portfolio">
          Michael Nevins
        </Link>
      </footer>
    </>
  );
}
