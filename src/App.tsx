import { useEffect, useRef } from "react";
import { Navigate, Route, Routes, useLocation, type Location } from "react-router-dom";
import Header from "./components/Header";
import AboutPage from "./pages/AboutPage";
import ArtPage from "./pages/ArtPage";
import PortfolioPage from "./pages/PortfolioPage";
import ProjectsPage from "./pages/ProjectsPage";

const sectionOrder = ["/projects", "/portfolio", "/art", "/about"];

function sectionPath(pathname: string) {
  if (pathname.startsWith("/projects")) return "/projects";
  if (pathname.startsWith("/art")) return "/art";
  if (pathname.startsWith("/about")) return "/about";
  return "/portfolio";
}

function sectionIndex(pathname: string) {
  const index = sectionOrder.indexOf(sectionPath(pathname));
  return index === -1 ? 1 : index;
}

function AppRoutes({ location }: { location: Location }) {
  return (
    <Routes location={location}>
      <Route path="/" element={<Navigate to="/portfolio" replace />} />
      <Route path="/portfolio" element={<PortfolioPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/art" element={<ArtPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="*" element={<Navigate to="/portfolio" replace />} />
    </Routes>
  );
}

function RouteTransitions() {
  const location = useLocation();
  const previousSectionRef = useRef(sectionPath(location.pathname));
  const currentSection = sectionPath(location.pathname);
  const direction =
    sectionIndex(location.pathname) >= sectionIndex(previousSectionRef.current)
      ? "forward"
      : "backward";

  useEffect(() => {
    previousSectionRef.current = currentSection;
  }, [currentSection]);

  return (
    <div
      className={`route-transition-stack route-transition-stack--${direction}`}
    >
      <div key={currentSection} className="route-transition-layer">
        <AppRoutes location={location} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <div className="vignette" aria-hidden="true" />
      <Header />
      <RouteTransitions />
    </>
  );
}
