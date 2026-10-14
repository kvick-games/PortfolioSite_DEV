import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, Link } from "react-router-dom";
import Header from "./components/Header";
import AboutPage from "./pages/AboutPage";
import ArtPage from "./pages/ArtPage";
import PortfolioPage from "./pages/PortfolioPage";
import ProjectsPage from "./pages/ProjectsPage";
export default function App() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const titles: Record<string, string> = {
      "/portfolio": "Work",
      "/projects": "Experiments",
      "/art": "Art",
      "/about": "About",
    };
    document.title = `${titles[location.pathname] ?? "Portfolio"} | Michael Nevins`;
    if (location.key !== "default")
      document
        .querySelector<HTMLElement>("main")
        ?.focus({ preventScroll: true });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08 },
    );
    document
      .querySelectorAll(
        "[data-reveal], .article-section > *, .art-gallery-item",
      )
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [location.pathname, location.search, location.key]);
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
        <Link to="/portfolio">Michael Nevins</Link>
        <p>Games, systems, and pictures.</p>
        <a
          href="https://www.artstation.com/kvick"
          target="_blank"
          rel="noreferrer"
        >
          ArtStation
        </a>
        <a
          href="https://github.com/kvick-games"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </footer>
    </>
  );
}
