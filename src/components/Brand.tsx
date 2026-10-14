import { Fragment } from "react";

/**
 * A Dreamatron name (the studio, or one of its apps such as Auteur or Dream
 * Engine), set to the brand rule: capitals with open letter spacing. The
 * spacing is styling, so screen readers still hear the plain name.
 */
export default function Brand({ name = "Dreamatron" }: { name?: string }) {
  return <span className="brand">{name}</span>;
}

const brandNames = /(Dreamatron|Dream Engine|Auteur)/gi;

/** Sets any Dreamatron names in a plain string to the brand rule; other text passes through. */
export function withBrand(text: string) {
  const parts = text.split(brandNames);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 ? <Brand key={i} name={part} /> : <Fragment key={i}>{part}</Fragment>,
  );
}
