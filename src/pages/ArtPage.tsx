import type { CSSProperties } from "react";
import { Link, useSearchParams } from "react-router-dom";
import LoopVideo from "../components/LoopVideo";
import PaintingRows, { markLoaded } from "../components/PaintingRows";
import { artDimensions } from "../data/artDimensions";
import { artPieces, getArtPiece } from "../data/artPieces";
import type { ArtPiece } from "../data/types";

function ArtOverview() {
  return (
    <>
      <section className="page-intro" aria-labelledby="art-title">
        <h1 id="art-title" className="page-title" data-reveal>
          Paintings
        </h1>
        <p className="statement" data-reveal>
          Characters, rooms and imagined places.
        </p>
      </section>
      <PaintingRows pieces={artPieces} eager={6} />
    </>
  );
}

function ArtDetail({ piece }: { piece: ArtPiece }) {
  const index = artPieces.indexOf(piece);
  const previous = artPieces[(index - 1 + artPieces.length) % artPieces.length];
  const next = artPieces[(index + 1) % artPieces.length];
  const extraImages = piece.images.slice(1);
  const others = Array.from(
    { length: 5 },
    (_, step) => artPieces[(index + 1 + step) % artPieces.length],
  );
  const description = piece.description?.replace(/https?:\/\/\S+/g, "").trim();
  const videoLink = piece.description?.match(/https?:\/\/\S+/)?.[0];
  const [width, height] = artDimensions[piece.slug] ?? [4, 3];
  return (
    <>
      <article className="art-detail">
        {/* A painting clicked elsewhere grows into this image (TransitionRouter). */}
        <figure
          className="art-detail-image"
          style={{ "--ratio": width / height } as CSSProperties}
        >
          <img
            key={piece.slug}
            ref={markLoaded}
            src={piece.coverImage}
            alt={piece.title}
            width={width}
            height={height}
            data-fade
            data-shared-painting
            onLoad={(event) => {
              event.currentTarget.dataset.loaded = "";
            }}
          />
          {piece.loop ? <LoopVideo key={piece.loop} src={piece.loop} /> : null}
        </figure>
        <div className="art-detail-side">
          <h1 className="chapter-title">{piece.title}</h1>
          {description ? <p>{description}</p> : null}
          {videoLink ? (
            <a
              className="text-link"
              href={videoLink}
              target="_blank"
              rel="noreferrer"
            >
              Watch the process video
            </a>
          ) : null}
          <a
            className="text-link"
            href={piece.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            View on ArtStation
          </a>
          <nav className="art-pager" aria-label="More paintings">
            <Link className="text-link" to={`/art?piece=${previous.slug}`}>
              Previous
            </Link>
            <Link className="text-link" to={`/art?piece=${next.slug}`}>
              Next
            </Link>
          </nav>
        </div>
        {piece.embedUrl || extraImages.length ? (
          <div className="art-detail-more">
            {piece.embedUrl ? (
              <div className="media-frame media-frame--video">
                <iframe
                  src={piece.embedUrl}
                  title={`${piece.title} animated study`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            ) : null}
            {extraImages.map((image, imageIndex) => (
              <figure className="media-frame" key={image}>
                <img
                  ref={markLoaded}
                  src={image}
                  alt={`${piece.title}, image ${imageIndex + 2}`}
                  loading="lazy"
                  data-fade
                  onLoad={(event) => {
                    event.currentTarget.dataset.loaded = "";
                  }}
                />
              </figure>
            ))}
          </div>
        ) : null}
      </article>
      <section className="art-detail-others" aria-labelledby="more-paintings">
        <h2 id="more-paintings">More paintings</h2>
        <PaintingRows pieces={others} />
      </section>
    </>
  );
}

export default function ArtPage() {
  const [searchParams] = useSearchParams();
  const selectedSlug = searchParams.get("piece");
  const piece = getArtPiece(selectedSlug);

  return (
    <main id="main" tabIndex={-1} className="page-shell art-page">
      {selectedSlug === null ? (
        <ArtOverview />
      ) : (
        <>
          <Link className="back-button" to="/art">
            All paintings
          </Link>
          {piece ? (
            <ArtDetail piece={piece} />
          ) : (
            <section>
              <h1 className="chapter-title">Painting not found</h1>
              <p>Choose a painting from the gallery.</p>
            </section>
          )}
        </>
      )}
    </main>
  );
}
