export const isCloudinaryImageUrl = (url) =>
  typeof url === 'string' && url.includes('res.cloudinary.com') && url.includes('/image/upload/');

export const withCloudinaryTransforms = (url, transformString) => {
  if (!isCloudinaryImageUrl(url)) return url;
  const marker = '/image/upload/';
  const [head, tail] = url.split(marker);
  if (!tail) return url;
  return `${head}${marker}${transformString}/${tail}`;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const buildOptimizedImageUrl = (url, width, height, mode = 'fit', options = {}) => {
  if (!isCloudinaryImageUrl(url)) return url;
  const { quality = 'auto', dpr = 'auto' } = options;
  const safeWidth = clamp(Math.round(width || 800), 320, 1600);
  const safeHeight = height ? clamp(Math.round(height), 200, 900) : null;
  const sizePart = safeHeight ? `w_${safeWidth},h_${safeHeight}` : `w_${safeWidth}`;
  const fitMode = mode === 'fill' ? 'c_fill,g_auto' : 'c_fit';
  const qualityPart = quality === 'auto' ? 'q_auto' : `q_auto:${quality}`;
  const dprPart = dpr === 'auto' ? 'dpr_auto' : `dpr_${dpr}`;
  const transformString = `f_auto,${qualityPart},${dprPart},${fitMode},${sizePart}`;
  return withCloudinaryTransforms(url, transformString);
};

export const buildBlurredImageUrl = (url, width, height, options = {}) => {
  if (!isCloudinaryImageUrl(url)) return url;
  const { quality = 'low', blur = 200 } = options;
  const safeWidth = clamp(Math.round(width || 800), 320, 1600);
  const safeHeight = height ? clamp(Math.round(height), 200, 900) : null;
  const sizePart = safeHeight ? `w_${safeWidth},h_${safeHeight}` : `w_${safeWidth}`;
  const qualityPart = quality === 'auto' ? 'q_auto' : `q_auto:${quality}`;
  const transformString = `f_auto,${qualityPart},c_fill,g_auto,${sizePart},e_blur:${blur}`;
  return withCloudinaryTransforms(url, transformString);
};
