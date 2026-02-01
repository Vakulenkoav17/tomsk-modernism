import { useEffect, useState } from 'react';
import useContainerSize from '../hooks/useContainerSize';
import { buildOptimizedImageUrl, buildBlurredImageUrl } from '../utils/cloudinary';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL, apiGet } from '../api/client';
import ArticleBlocks from '../components/ArticleBlocks';

const TYPE_CONFIG = {
  object: {
    title: 'Объект не найден',
    hasMap: true,
  },
  architect: {
    title: 'Архитектор не найден',
    hasMap: false,
  },
  mosaic: {
    title: 'Мозаика не найдена',
    hasMap: true,
  },
};

const TYPE_ENDPOINTS = {
  object: '/api/objects',
  architect: '/api/architects',
  mosaic: '/api/mosaics',
};

export default function DetailsPage({ type }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const { ref: heroRef, width: heroWidth, height: heroHeight } = useContainerSize({ step: 100 });

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.object;
  const endpoint = TYPE_ENDPOINTS[type] || TYPE_ENDPOINTS.object;

  const [item, setItem] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadDetails = async () => {
      setLoading(true);
      setError('');
      setItem(null);
      setRecommended([]);

      try {
        const data = await apiGet(`${endpoint}/${id}`);
        if (!isActive) return;
        setItem(data);

        const recData = await apiGet(`${endpoint}?limit=3&excludeId=${id}&sample=1`);
        if (!isActive) return;
        const filtered = (recData || []).filter((rec) => String(rec.id || rec._id) !== String(id));
        setRecommended(filtered);
      } catch (err) {
        if (!isActive) return;
        setError(err.message || 'Ошибка загрузки');
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadDetails();

    return () => {
      isActive = false;
    };
  }, [endpoint, id]);

  if (loading) {
    return (
      <main className="details-page details-skeleton">
        <section className="details-hero">
          <div className="details-hero-media skeleton-block details-hero-skeleton" />
        </section>
        <section className="details-info">
          <div className="details-col">
            <div className="skeleton-line skeleton-line--title" />
            <div className="details-meta">
              <div className="skeleton-line skeleton-line--meta" />
              <div className="skeleton-line skeleton-line--meta" />
              <div className="skeleton-line skeleton-line--meta" />
            </div>
            <div className="skeleton-line skeleton-line--body" />
            <div className="skeleton-line skeleton-line--body" />
          </div>
        </section>
      </main>
    );
  }

  if (!item) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <p>{error || `${config.title}. Проверьте ссылку или вернитесь в список.`}</p>
      </div>
    );
  }

  const imageUrl = item.image
    ? item.image.startsWith('http')
      ? item.image
      : `${API_URL}${item.image}`
    : null;
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const heroMainUrl = imageUrl
    ? buildOptimizedImageUrl(imageUrl, heroWidth, heroHeight, "fit", { quality: 'good', dpr })
    : null;

  const handleAddressClick = () => {
    if (type === 'object' || type === 'mosaic') {
      navigate('/map', { state: { focusItemId: item.id, focusItemType: type } });
    }
  };

  const renderMeta = () => {
    if (type === 'object') {
      return (
        <>
          <p><b>Архитектор:</b> {item.architect || 'N/A'}</p>
          <p><b>Год:</b> {item.year || 'N/A'}</p>
          <p>
            <b>Адрес:</b>{' '}
            <button
              type="button"
              className="link-button"
              onClick={handleAddressClick}
            >
              {item.address}
            </button>
          </p>
        </>
      );
    }

    if (type === 'architect') {
      return <p><b>Годы жизни:</b> {item.years || 'N/A'}</p>;
    }

    return (
      <p>
        <b>Адрес:</b>{' '}
        {item.location ? (
          <button type="button" className="link-button" onClick={handleAddressClick}>
            {item.location}
          </button>
        ) : (
          'N/A'
        )}
      </p>
    );
  };

  const renderDesc = () => {
    if (type === 'architect') return item.bio;
    return item.desc;
  };

  const renderRecommendedMeta = (rec) => {
    if (type === 'object') {
      return (
        <>
          {rec.architect} {rec.year && `- ${rec.year}`}
        </>
      );
    }
    if (type === 'architect') return rec.years;
    return rec.location;
  };

  const recommendedPath = (rec) => {
    if (type === 'architect') return `/architects/${rec.id}`;
    if (type === 'mosaic') return `/mosaics/${rec.id}`;
    return `/objects/${rec.id}`;
  };

  const heroBackdropUrl = imageUrl
    ? buildBlurredImageUrl(imageUrl, heroWidth, heroHeight)
    : null;

  return (
    <main className="details-page">
      {imageUrl && (
        <section className="details-hero">
          <div className="details-hero-media" ref={heroRef}>
            {heroBackdropUrl && (
              <img
                className="media-backdrop"
                src={heroBackdropUrl}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
              />
            )}
            {heroMainUrl && (
              <img
                className="media-foreground"
                src={heroMainUrl}
                alt={item.name}
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
        </section>
      )}

      <section className="details-info">
        <div className="details-col">
          <h2 className="details-title">{item.name}</h2>
          <div className="details-meta">{renderMeta()}</div>
          {renderDesc() && <p className="details-desc">{renderDesc()}</p>}
        </div>
      </section>

      <section className="details-article">
        <ArticleBlocks blocks={item.articleBlocks} />
      </section>

      {recommended.length > 0 && (
        <section className="details-recommended">
          <div className="details-col">
            <h3 className="detail-subtitle">Рекомендуем</h3>
            <div className="gallery-grid">
              {recommended.map((rec) => (
                <div
                  key={rec.id}
                  className="card"
                  onClick={() => navigate(recommendedPath(rec))}
                >
                  <div className="card-image">
                    {rec.image ? (
                      <img
                        src={rec.image.startsWith('http') ? rec.image : `${API_URL}${rec.image}`}
                        alt={rec.name}
                      />
                    ) : (
                      <div className="card-image-placeholder">Нет изображения: {rec.name}</div>
                    )}
                  </div>
                  <div className="card-content">
                    <div className="card-title">{rec.name}</div>
                    <div className="card-meta">
                      {renderRecommendedMeta(rec)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
