export default function LoadingGallery({ title, count = 6 }) {
  const items = Array.from({ length: count }, (_, index) => index);

  return (
    <div className="gallery">
      {title && <h2 className="gallery-title">{title}</h2>}
      <div className="gallery-grid">
        {items.map((item) => (
          <div key={item} className="card skeleton-card" aria-hidden="true">
            <div className="card-image skeleton-block skeleton-image" />
            <div className="card-content">
              <div className="skeleton-line skeleton-line--title" />
              <div className="skeleton-line skeleton-line--body" />
              <div className="skeleton-line skeleton-line--meta" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
