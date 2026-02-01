import { useCallback } from 'react';
import { API_URL } from '../api/client';
import useContainerSize from '../hooks/useContainerSize';
import { buildOptimizedImageUrl, buildBlurredImageUrl } from '../utils/cloudinary';
import useSmoothScroll from '../hooks/useSmoothScroll';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const resolveImageUrl = (value) => {
  if (!value) return '';
  return value.startsWith('http') ? value : `${API_URL}${value}`;
};



const Arrow = ({ className = '', onClick, direction, onScroll }) => (
  <button
    type="button"
    className={`article-slider-arrow article-slider-arrow--${direction} ${className}`.trim()}
    onClick={(event) => {
      if (onScroll) onScroll();
      if (onClick) onClick(event);
    }}
    aria-label={direction === 'prev' ? 'Предыдущая фотография' : 'Следующая фотография'}
  >
    <span className="article-slider-arrow-icon" aria-hidden="true" />
  </button>
);

function ArticleBlock({ block }) {
  const images = Array.isArray(block.images) ? block.images : [];
  const slides = images.length === 2 ? [...images, ...images] : images;
  const hasSlider = images.length > 1;
  const { ref: mediaRef, width: targetWidth, height: targetHeight } = useContainerSize({ step: 200 });
  const smoothScroll = useSmoothScroll();
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const handleArrowScroll = useCallback(() => {
    if (mediaRef.current) {
      smoothScroll(mediaRef.current, 100, 650);
    }
  }, [mediaRef, smoothScroll]);

  const blurActiveElement = () => {
    if (typeof document === 'undefined') return;
    const active = document.activeElement;
    if (active && typeof active.blur === 'function') {
      active.blur();
    }
  };
  const sliderSettings = {
    arrows: true,
    centerMode: false,
    centerPadding: '0',
    infinite: slides.length > 1,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    speed: 400,
    focusOnSelect: false,
    beforeChange: blurActiveElement,
    afterChange: blurActiveElement,
    prevArrow: <Arrow direction="prev" onScroll={handleArrowScroll} />,
    nextArrow: <Arrow direction="next" onScroll={handleArrowScroll} />,
    responsive: [
      { breakpoint: 768, settings: { centerPadding: '6%' } },
    ],
  };



  return (
    <div className="article-block">
      {slides.length > 0 && (
        hasSlider ? (
          <div className="article-media-wrap">
            <div className="article-media-full">
              <div className="article-media article-media--slider" ref={mediaRef}>
                <Slider className="article-slider" {...sliderSettings}>
                  {slides.map((img, idx) => {
                    const resolvedUrl = resolveImageUrl(img);
                    const mainUrl = buildOptimizedImageUrl(
                      resolvedUrl,
                      targetWidth,
                      targetHeight,
                      "fit",
                      { quality: 'good', dpr }
                    );
                    const backdropUrl = buildBlurredImageUrl(resolvedUrl, targetWidth, targetHeight);
                    return (
                    <div key={`${block.id || 'block'}-${idx}`}>
                      <div className="article-slide">
                        {backdropUrl && (
                          <img
                            className="media-backdrop"
                            src={backdropUrl}
                            alt=""
                            aria-hidden="true"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                        <img
                          className="media-foreground"
                          src={mainUrl}
                          alt=""
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    </div>
                  );})}
                </Slider>
              </div>

              {block.caption && (
                <div className="article-media-caption">{block.caption}</div>
              )}
            </div>
          </div>
        ) : (
          <div className="details-col">
            <div className="article-media article-media--single" ref={mediaRef}>
              {(() => {
                const resolvedUrl = resolveImageUrl(slides[0]);
                const mainUrl = buildOptimizedImageUrl(
                  resolvedUrl,
                  targetWidth,
                  targetHeight,
                  "fit",
                  { quality: 'good', dpr }
                );
                const backdropUrl = buildBlurredImageUrl(resolvedUrl, targetWidth, targetHeight);
                return (
                  <>
                    {backdropUrl && (
                      <img
                        className="media-backdrop"
                        src={backdropUrl}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <img
                      className="media-foreground"
                      src={mainUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  </>
                );
              })()}
            </div>

            {block.caption && (
              <div className="article-media-caption">{block.caption}</div>
            )}
          </div>
        )
      )}
      {block.text && (
        <div className="details-col">
          <p className="article-text">{block.text}</p>
        </div>
      )}
    </div>
  );
}

export default function ArticleBlocks({ blocks }) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  return (
    <section className="article-section">
      {blocks.map((block, idx) => (
        <ArticleBlock key={block.id || idx} block={block} />
      ))}
    </section>
  );
}
