import Brand from "./Brand";
import { Link, useLocation } from "react-router-dom";
import { contact } from "../data/site";
import ThemeToggle from "./ThemeToggle";

/** The header's links: sections of the home page. */
const sections = [
  { id: "work", label: "Work" },
  { id: "dreamatron", label: <Brand /> },
  { id: "paintings", label: "Paintings" },
  { id: "about", label: "About" },
];

export default function Header() {
  const { pathname, search } = useLocation();
  const onHome = pathname === "/portfolio" && !search;
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Primary">
        {sections.map(({ id, label }) =>
          // On the home page each link scrolls to its section; from another
          // page, a router Link so the page cross-fades instead of reloading.
          onHome ? (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ) : (
            <Link key={id} to={`/portfolio#${id}`}>
              {label}
            </Link>
          ),
        )}
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
