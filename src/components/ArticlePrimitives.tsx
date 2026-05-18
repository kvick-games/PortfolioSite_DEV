import type { ReactNode } from "react";

interface ArticleShellProps {
  title: string;
  eyebrow?: string;
  details: string[];
  children: ReactNode;
}

interface MediaImageProps {
  src: string;
  alt: string;
  size?: "full" | "wide" | "medium";
}

interface YouTubeEmbedProps {
  title: string;
  src: string;
  watchUrl?: string;
}

export function ArticleShell({ title, eyebrow, details, children }: ArticleShellProps) {
  return (
    <article className="project-article">
      <header className="project-article-header">
        {eyebrow ? <p className="project-article-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        <dl className="project-details">
          {details.map((detail) => (
            <div key={detail}>
              <dt className="sr-only">Project detail</dt>
              <dd>{detail}</dd>
            </div>
          ))}
        </dl>
      </header>
      <div className="project-article-body">{children}</div>
    </article>
  );
}

export function ArticleSection({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="article-section">
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  );
}

export function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="feature-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function MediaImage({ src, alt, size = "full" }: MediaImageProps) {
  return (
    <figure className={`media-frame media-frame--${size}`}>
      <img src={src} alt={alt} loading="lazy" />
    </figure>
  );
}

export function ArticleHero({
  image,
  title,
  kicker,
  description,
  meta,
}: {
  image: string;
  title: string;
  kicker: string;
  description: string;
  meta: string[];
}) {
  return (
    <section className="article-hero" style={{ backgroundImage: `url(${image})` }}>
      <div className="article-hero-content">
        <p className="article-hero-kicker">{kicker}</p>
        <h2>{title}</h2>
        <p>{description}</p>
        <ul aria-label="Hero project highlights">
          {meta.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function VideoFrame({
  src,
  title,
  type = "video/mp4",
}: {
  src: string;
  title: string;
  type?: string;
}) {
  return (
    <figure className="media-frame media-frame--video">
      <video controls loop preload="metadata" aria-label={title}>
        <source src={src} type={type} />
        Your browser does not support the video tag.
      </video>
    </figure>
  );
}

export function YouTubeEmbed({ title, src, watchUrl }: YouTubeEmbedProps) {
  return (
    <figure className="media-embed">
      <div className="media-frame media-frame--video">
        <iframe
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      {watchUrl ? (
        <figcaption>
          <a href={watchUrl} target="_blank" rel="noreferrer">
            Watch trailer on YouTube
          </a>
        </figcaption>
      ) : null}
    </figure>
  );
}

export function ExternalVideoLink({
  title,
  href,
  image,
  description,
}: {
  title: string;
  href: string;
  image: string;
  description: string;
}) {
  return (
    <a className="external-video-card" href={href} target="_blank" rel="noreferrer">
      <span
        className="external-video-card-media"
        aria-hidden="true"
        style={{ backgroundImage: `url(${image})` }}
      />
      <span className="external-video-card-content">
        <span className="external-video-card-kicker">Trailer</span>
        <span className="external-video-card-title">{title}</span>
        <span className="external-video-card-description">{description}</span>
        <span className="external-video-card-action">Watch on YouTube</span>
      </span>
    </a>
  );
}

export function LinkButtons({
  links,
}: {
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div className="project-link-buttons">
      {links.map((link) => (
        <a
          key={link.href}
          className="project-link-button"
          href={link.href}
          target="_blank"
          rel="noreferrer"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

export function SplitFeature({
  image,
  imageAlt,
  imageFirst = false,
  children,
}: {
  image: string;
  imageAlt: string;
  imageFirst?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={imageFirst ? "split-feature split-feature--image-first" : "split-feature"}>
      <div className="split-feature-copy">{children}</div>
      <MediaImage src={image} alt={imageAlt} />
    </div>
  );
}
