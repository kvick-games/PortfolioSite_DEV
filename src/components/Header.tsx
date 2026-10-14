import Brand from "./Brand";
import { Link, NavLink, useLocation } from "react-router-dom";
import { contact } from "../data/site";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const { pathname, search } = useLocation();
  const onHome = pathname === "/portfolio" && !search;
  return (
    <header className="site-header">
      <Link className="wordmark" to="/portfolio">
        Michael Nevins
      </Link>
      <nav className="site-nav" aria-label="Primary">
        <NavLink
          to="/portfolio"
          className={() => (pathname === "/portfolio" ? "active" : undefined)}
        >
          Work
        </NavLink>
        <a href={onHome ? "#dreamatron" : "/portfolio#dreamatron"}>
          <Brand />
        </a>
        <NavLink to="/art">Paintings</NavLink>
        <NavLink to="/about">About</NavLink>
      </nav>
      <div className="header-end">
        <a className="header-contact" href={contact.href} target="_blank" rel="noreferrer">
          {contact.label}
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}
