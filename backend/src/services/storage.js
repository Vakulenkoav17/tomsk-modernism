const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');

const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads');

const driver = process.env.STORAGE_DRIVER || 'local';
const isCloudinary = driver === 'cloudinary';

if (isCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const resolveLocalPath = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return null;
  if (!imagePath.startsWith('/')) return null;
  const trimmed = imagePath.replace(/^\/+/, '').replace(/\\/g, '/');
  const fullPath = path.resolve(UPLOADS_ROOT, trimmed);
  if (!fullPath.startsWith(UPLOADS_ROOT)) return null;
  return fullPath;
};

const deleteLocalFile = async (imagePath) => {
  const resolved = resolveLocalPath(imagePath);
  if (!resolved) return;
  try {
    await fs.promises.unlink(resolved);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
};

const extractPublicId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const parts = url.split('/upload/');
  if (parts.length < 2) return null;
  let tail = parts[1].split('?')[0];
  const segments = tail.split('/').filter(Boolean);
  const versionIndex = segments.findIndex((segment) => /^v\d+$/.test(segment));
  const relevant = versionIndex >= 0 ? segments.slice(versionIndex + 1) : segments;
  if (relevant.length === 0) return null;
  const path = relevant.join('/');
  const withoutExt = path.replace(/\.[^/.]+$/, '');
  return withoutExt || null;
};

const uploadToCloudinary = (file, folder) =>
  new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      reject(new Error('File buffer is missing'));
      return;
    }
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, result) => {
        if (err) {
          console.error('Cloudinary upload failed', err);
          reject(err);
          return;
        }
        resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });

const uploadImage = async (file, folder) => {
  if (!file) return null;
  if (!isCloudinary) {
    return `/${folder}/${file.filename}`;
  }
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('CLOUDINARY_CLOUD_NAME is not set');
  }
  return uploadToCloudinary(file, `tomsk-modernism/${folder}`);
};

const uploadImages = async (files, folder) => {
  if (!files || files.length === 0) return [];
  if (!isCloudinary) {
    return files.map((file) => `/${folder}/${file.filename}`);
  }
  return Promise.all(files.map((file) => uploadToCloudinary(file, `tomsk-modernism/${folder}`)));
};

const deleteRemoteFile = async (imagePath) => {
  if (!imagePath) return;
  const publicId = extractPublicId(imagePath);
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
};

const deleteStoredImage = async (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return;
  if (imagePath.startsWith('http') || isCloudinary) {
    await deleteRemoteFile(imagePath);
    return;
  }
  await deleteLocalFile(imagePath);
};

module.exports = {
  deleteStoredImage,
  uploadImage,
  uploadImages,
};
