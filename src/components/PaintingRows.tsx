import { Link } from "react-router-dom";
import { artDimensions } from "../data/artDimensions";
import type { ArtPiece } from "../data/types";

/**
 * Paintings in justified rows: every work keeps its own proportions and each row
 * fills the measure. Row height is set by the --row custom property.
 */
export default function PaintingRows({
  pieces,
  eager = 0,
}: {
  pieces: ArtPiece[];
  eager?: number;
}) {
  return (
    <ul className="painting-rows">
      {pieces.map((piece, index) => {
        const [width, height] = artDimensions[piece.slug] ?? [4, 3];
        const ratio = width / height;
        return (
          <li
            key={piece.slug}
            style={{ flexGrow: ratio, flexBasis: `calc(var(--row) * ${ratio})` }}
            data-reveal
          >
            <Link to={`/art?piece=${piece.slug}`} className="painting-link">
              <img
                src={piece.coverImage}
                alt=""
                width={width}
                height={height}
                loading={index < eager ? "eager" : "lazy"}
              />
              <span className="painting-title">{piece.title}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
