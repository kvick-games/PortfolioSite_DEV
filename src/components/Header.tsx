import { NavLink, Link } from "react-router-dom";
export default function Header() {
  return (
    <header className="site-header">
      <Link
        className="wordmark"
        to="/portfolio"
        aria-label="Michael Nevins home"
      >
        Michael Nevins
      </Link>
      <nav className="site-nav" aria-label="Primary navigation">
        <NavLink to="/portfolio">Work</NavLink>
        <NavLink to="/projects">Experiments</NavLink>
        <NavLink to="/art">Art</NavLink>
        <NavLink to="/about">About</NavLink>
      </nav>
      <a
        className="header-contact"
        href="https://www.linkedin.com/in/michael-nevins-690b3140/"
        target="_blank"
        rel="noreferrer"
      >
        Get in touch <span aria-hidden="true">↗</span>
      </a>
    </header>
  );
}
