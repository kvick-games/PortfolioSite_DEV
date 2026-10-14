import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { artPieces, getArtPiece } from "../data/artPieces";
import type { ArtPiece } from "../data/types";

function artCardClass(index: number) {
  if (index === 0 || index === 5 || index === 12) {
    return "art-gallery-item art-gallery-item--featured";
  }

  if (index % 7 === 0 || index % 11 === 0) {
    return "art-gallery-item art-gallery-item--tall";
  }

  if (index % 4 === 0) {
    return "art-gallery-item art-gallery-item--wide";
  }

  return "art-gallery-item";
}

function ArtCard({
  piece,
  index,
  onSelect,
  disabled,
}: {
  piece: ArtPiece;
  index: number;
  onSelect: (slug: string) => void;
  disabled: boolean;
}) {
  return (
    <li className={artCardClass(index)}>
      <button
        className="art-gallery-card"
        type="button"
        onClick={() => onSelect(piece.slug)}
        disabled={disabled}
        aria-label={`Open ${piece.title} artwork`}
      >
        <img src={piece.coverImage} alt="" loading="lazy" />
        <span className="art-gallery-card-label">
          <span className="art-gallery-card-title">{piece.title}</span>
          {piece.description ? (
            <span className="art-gallery-card-description">{piece.description}</span>
          ) : null}
        </span>
      </button>
    </li>
  );
}

function ArtOverview({
  onSelect,
  isHidden,
}: {
  onSelect: (slug: string) => void;
  isHidden: boolean;
}) {
  return (
    <div className="portfolio-overview-panel" aria-hidden={isHidden}>
      <h1 className="sr-only" id="art-title">
        Art gallery
      </h1>
      <ul className="art-gallery-grid" aria-labelledby="art-title">
        {artPieces.map((piece, index) => (
          <ArtCard
            key={piece.slug}
            piece={piece}
            index={index}
            onSelect={onSelect}
            disabled={isHidden}
          />
        ))}
      </ul>
    </div>
  );
}

function ArtPieceMedia({ piece }: { piece: ArtPiece }) {
  const extraImages = piece.images.slice(1);

  return (
    <>
      <figure className="art-piece-hero-image">
        <img src={piece.coverImage} alt={`${piece.title} artwork`} />
      </figure>

      {piece.embedUrl ? (
        <section className="article-section">
          <h2>Animated study</h2>
          <figure className="media-embed">
            <div className="media-frame media-frame--video">
              <iframe
                src={piece.embedUrl}
                title={`${piece.title} video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </figure>
        </section>
      ) : null}

      {extraImages.length ? (
        <section className="article-section">
          <h2>Additional images</h2>
          <div className="art-piece-media-grid">
            {extraImages.map((image, index) => (
              <figure className="media-frame" key={image}>
                <img src={image} alt={`${piece.title} artwork ${index + 2}`} loading="lazy" />
              </figure>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function ArtPanel({
  piece,
  requestedSlug,
  onClose,
}: {
  piece: ArtPiece | null;
  requestedSlug: string | null;
  onClose: () => void;
}) {
  if (requestedSlug === null) {
    return null;
  }

  if (!piece) {
    return (
      <section className="project-panel-content project-panel-content--empty" aria-live="polite">
        <button className="back-button" type="button" onClick={onClose}>
          Back to art
        </button>
        <h1>Artwork not found</h1>
        <p>
          No ArtStation piece matches <code>{requestedSlug}</code>. Return to the gallery and
          choose a piece from the current archive.
        </p>
      </section>
    );
  }

  return (
    <section className="project-panel-content art-panel-content" aria-live="polite">
      <button className="back-button" type="button" onClick={onClose}>
        Back to art
      </button>
      <article className="project-article art-piece-article">
        <header className="project-article-header">
          <p className="project-article-eyebrow">ArtStation archive</p>
          <h1>{piece.title}</h1>
          <dl className="project-details">
            <div>
              <dt className="sr-only">Image count</dt>
              <dd>{piece.images.length > 1 ? `${piece.images.length} images` : "Single image"}</dd>
            </div>
            <div>
              <dt className="sr-only">Source</dt>
              <dd>Local archive</dd>
            </div>
            {piece.embedUrl ? (
              <div>
                <dt className="sr-only">Video</dt>
                <dd>Video embed</dd>
              </div>
            ) : null}
          </dl>
        </header>
        <div className="project-article-body">
          <ArtPieceMedia piece={piece} />
          {piece.description ? <p className="art-piece-description">{piece.description}</p> : null}
          <div className="project-link-buttons">
            <a className="project-link-button" href={piece.sourceUrl} target="_blank" rel="noreferrer">
              View on ArtStation
            </a>
          </div>
        </div>
      </article>
    </section>
  );
}

export default function ArtPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSlug = searchParams.get("piece");
  const selectedPiece = getArtPiece(selectedSlug);
  const hasPieceQuery = selectedSlug !== null;
  const backgroundImage = selectedPiece?.coverImage ?? artPieces[0]?.coverImage ?? "";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [selectedSlug]);

  const handleSelect = (slug: string) => {
    setSearchParams({ piece: slug });
  };

  const handleClose = () => {
    setSearchParams({});
  };

  return (
    <main className="page-shell art-page">
      <div
        className="fixed-project-background art-page-background"
        aria-hidden="true"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className={hasPieceQuery ? "portfolio-stage portfolio-stage--article" : "portfolio-stage"}>
        <ArtOverview onSelect={handleSelect} isHidden={hasPieceQuery} />
        <div className="portfolio-article-panel" aria-hidden={!hasPieceQuery}>
          <ArtPanel piece={selectedPiece} requestedSlug={selectedSlug} onClose={handleClose} />
        </div>
      </div>
    </main>
  );
}
