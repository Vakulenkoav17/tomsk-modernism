const mongoose = require('mongoose');
const Mosaic = require('../models/Mosaic');
const { deleteStoredImage, uploadImage } = require('../services/storage');
const asyncHandler = require('../middleware/asyncHandler');
const { parseBoolean, parseNumber, parseJsonArray } = require('../utils/parse');
const { mosaicCreateSchema, mosaicUpdateSchema } = require('../validators/schemas');

const validatePayload = (schema, payload) => {
  const { error } = schema.validate(payload, { abortEarly: false });
  if (!error) return null;
  return error.details.map((detail) => detail.message);
};

const buildMosaicPayload = (body, file, { defaults = false } = {}) => {
  const polygon = parseJsonArray(body.polygonCoords);
  if (polygon.error) return { error: 'polygonCoords must be a JSON array' };

  const articles = parseJsonArray(body.articleBlocks);
  if (articles.error) return { error: 'articleBlocks must be a JSON array' };

  const payload = {
    name: body.name,
    author: body.author,
    year: body.year,
    location: body.location,
    desc: body.desc,
    lat: parseNumber(body.lat, defaults ? null : undefined),
    lng: parseNumber(body.lng, defaults ? null : undefined),
    polygonCoords: polygon.value ?? (defaults ? [] : undefined),
    isUnique: parseBoolean(body.isUnique, defaults ? false : undefined),
    hasCard: parseBoolean(body.hasCard, defaults ? false : undefined),
    articleBlocks: articles.value ?? (defaults ? [] : undefined),
  };

  return { payload };
};

const listMosaics = asyncHandler(async (req, res) => {
  const { limit, excludeId, sample } = req.query;
  const query = {};
  if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
  }

  const parsedLimit = Number(limit);
  const useSample = sample === 'true' || sample === '1';

  let items;
  if (!Number.isNaN(parsedLimit) && parsedLimit > 0 && useSample) {
    items = await Mosaic.aggregate([
      { $match: query },
      { $sample: { size: parsedLimit } },
      { $addFields: { id: { $toString: '$_id' } } },
      { $project: { __v: 0 } },
    ]);
  } else {
    const cursor = Mosaic.find(query);
    if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
      cursor.limit(parsedLimit);
    }
    items = await cursor;
  }
  res.json(items);
});

const getMosaic = asyncHandler(async (req, res) => {
  const item = await Mosaic.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

const createMosaic = asyncHandler(async (req, res) => {
  const built = buildMosaicPayload(req.body, req.file, { defaults: true });
  if (built.error) {
    return res.status(400).json({ error: built.error });
  }

  let imageUrl = null;
  if (req.file) {
    imageUrl = await uploadImage(req.file, 'mosaics');
  }

  const payload = { ...built.payload, ...(imageUrl ? { image: imageUrl } : {}) };

  const validationErrors = validatePayload(mosaicCreateSchema, payload);
  if (validationErrors) {
    if (imageUrl) await deleteStoredImage(imageUrl);
    return res.status(400).json({ error: 'Validation error', details: validationErrors });
  }

  try {
    const created = await Mosaic.create(payload);
    res.status(201).json(created);
  } catch (err) {
    if (imageUrl) await deleteStoredImage(imageUrl);
    throw err;
  }
});

const updateMosaic = asyncHandler(async (req, res) => {
  let existing = null;
  if (req.file) {
    existing = await Mosaic.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
  }

  const built = buildMosaicPayload(req.body, req.file);
  if (built.error) {
    return res.status(400).json({ error: built.error });
  }

  const updates = built.payload;
  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) delete updates[key];
  });

  let newImage = null;
  if (req.file) {
    newImage = await uploadImage(req.file, 'mosaics');
    updates.image = newImage;
  }

  const validationErrors = validatePayload(mosaicUpdateSchema, updates);
  if (validationErrors) {
    if (newImage) await deleteStoredImage(newImage);
    return res.status(400).json({ error: 'Validation error', details: validationErrors });
  }

  const updated = await Mosaic.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!updated) {
    if (newImage) await deleteStoredImage(newImage);
    return res.status(404).json({ error: 'Not found' });
  }

  if (existing && existing.image && existing.image !== updated.image) {
    try {
      await deleteStoredImage(existing.image);
    } catch (err) {
      console.error('Failed to delete image', err);
    }
  }

  res.json(updated);
});

const deleteMosaic = asyncHandler(async (req, res) => {
  const item = await Mosaic.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });

  await Mosaic.findByIdAndDelete(req.params.id);
  if (item.image) {
    try {
      await deleteStoredImage(item.image);
    } catch (err) {
      console.error('Failed to delete image', err);
    }
  }
  res.json({ message: 'Deleted' });
});

module.exports = {
  listMosaics,
  getMosaic,
  createMosaic,
  updateMosaic,
  deleteMosaic,
};
