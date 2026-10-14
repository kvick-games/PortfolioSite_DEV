import { useEffect, useState, type MouseEvent } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { href: "/projects", label: "Projects" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/art", label: "Art" },
  { href: "/about", label: "About" },
];

function sectionForPath(pathname: string) {
  if (pathname.startsWith("/about")) return "About";
  if (pathname.startsWith("/art")) return "Art";
  if (pathname.startsWith("/projects")) return "Projects";
  return "Portfolio";
}

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let previousScrollY = window.scrollY;

    const handleScroll = () => {
      const nextScrollY = window.scrollY;
      setHidden(nextScrollY > previousScrollY && nextScrollY > 42);
      previousScrollY = nextScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const section = sectionForPath(location.pathname);

  const handleNavigation = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();

    if (location.pathname !== href) {
      navigate(href);
    }
  };

  return (
    <header className={hidden ? "site-header site-header--hidden" : "site-header"}>
      <div className="header-title" aria-label={`MICHAEL NEVINS, ${section}`}>
        <span className="header-name">MICHAEL NEVINS</span>
        <span className="header-separator" aria-hidden="true">
          /
        </span>
        <span className="header-section">{section}</span>
      </div>
      <nav className="site-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={(event) => handleNavigation(event, item.href)}
            className={({ isActive }) =>
              isActive ? "site-nav-link site-nav-link--active" : "site-nav-link"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
