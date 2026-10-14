/**
 * A Dreamatron name (the studio, or an app such as Auteur), set to the brand
 * rule: capitals with open letter spacing. The spacing is styling, so screen
 * readers still hear one word.
 */
export default function Brand({ name = "Dreamatron" }: { name?: string }) {
  return <span className="brand">{name}</span>;
}

/** Swaps a plain "Dreamatron" label for the branded name; other text passes through. */
export function withBrand(text: string) {
  return /^dreamatron$/i.test(text) ? <Brand /> : text;
}
