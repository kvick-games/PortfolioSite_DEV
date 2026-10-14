import Brand from "./Brand";
import { Link } from "react-router-dom";
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
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Primary">
        {/* Router links, so the page cross-fades to the section (TransitionRouter),
            whether it's this page or another. */}
        {sections.map(({ id, label }) => (
          <Link key={id} to={`/portfolio#${id}`}>
            {label}
          </Link>
        ))}
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
