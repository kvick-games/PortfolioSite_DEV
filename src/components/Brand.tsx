/**
 * The Dreamatron name, set to the brand rule: capitals with open letter
 * spacing. The spacing is styling, so screen readers still hear one word.
 */
export default function Brand() {
  return <span className="brand">Dreamatron</span>;
}

/** Swaps a plain "Dreamatron" label for the branded name; other text passes through. */
export function withBrand(text: string) {
  return /^dreamatron$/i.test(text) ? <Brand /> : text;
}
