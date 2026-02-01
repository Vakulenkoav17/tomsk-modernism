import { useNavigate } from 'react-router-dom';
import { API_URL } from '../api/client';
import useContainerSize from '../hooks/useContainerSize';
import { buildOptimizedImageUrl } from '../utils/cloudinary';

export default function Card({ item, type = 'object' }) {
  const navigate = useNavigate();
  const { ref: imageRef, width, height } = useContainerSize({ step: 100 });

  const getImageUrl = () => {
    if (item.image) {
      return item.image.startsWith('http') ? item.image : `${API_URL}${item.image}`;
    }
    return null;
  };

  const imageUrl = getImageUrl();
  const dpr = 2;
  const targetWidth = Math.max(width || 0, 600);
  const targetHeight = height || 0;
  const optimizedImageUrl = imageUrl
    ? buildOptimizedImageUrl(imageUrl, targetWidth, targetHeight, 'fill', { quality: 'auto', dpr })
    : null;

  const getMeta = () => {
    if (type === 'object') {
      return (
        <>
          {item.architect && <span className="card-architect">{item.architect}</span>}
          {item.year && <span className="card-year">{item.year}</span>}
        </>
      );
    }
    if (type === 'architect') return item.years;
    if (type === 'mosaic') return item.location;
    return '';
  };

  const handleClick = () => {
    if (type === 'object') navigate(`/objects/${item.id}`);
    if (type === 'architect') navigate(`/architects/${item.id}`);
    if (type === 'mosaic') navigate(`/mosaics/${item.id}`);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className="card"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={item.name}
    >
      <div className="card-image" ref={imageRef}>
        {optimizedImageUrl ? (
          <img
            src={optimizedImageUrl}
            alt={item.name}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="card-image-placeholder">[Фото: {item.name}]</div>
        )}
      </div>
      <div className="card-content">
        <div className="card-title">{item.name}</div>
        <div className="card-desc">
          {type === 'object' && item.desc}
          {type === 'architect' && item.bio}
          {type === 'mosaic' && item.desc}
        </div>
        <div className="card-meta">{getMeta()}</div>
      </div>
    </div>
  );
}
