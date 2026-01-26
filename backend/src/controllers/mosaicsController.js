const mongoose = require('mongoose');
const Mosaic = require('../models/Mosaic');
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
    year: parseNumber(body.year, undefined),
    location: body.location,
    desc: body.desc,
    lat: parseNumber(body.lat, defaults ? null : undefined),
    lng: parseNumber(body.lng, defaults ? null : undefined),
    polygonCoords: polygon.value ?? (defaults ? [] : undefined),
    isUnique: parseBoolean(body.isUnique, false),
    hasCard: parseBoolean(body.hasCard, false),
    articleBlocks: articles.value ?? (defaults ? [] : undefined),
  };

  if (file) payload.image = `/mosaics/${file.filename}`;

  return { payload };
};

const listMosaics = asyncHandler(async (req, res) => {
  const { limit, excludeId, sample } = req.query;
  const query = {};
  if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
    query._id = { $ne: excludeId };
  }

  const parsedLimit = Number(limit);
  const useSample = sample === 'true' || sample === '1';

  let items;
  if (!Number.isNaN(parsedLimit) && parsedLimit > 0 && useSample) {
    items = await Mosaic.aggregate([
      { $match: query },
      { $sample: { size: parsedLimit } },
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

  const validationErrors = validatePayload(mosaicCreateSchema, built.payload);
  if (validationErrors) {
    return res.status(400).json({ error: 'Validation error', details: validationErrors });
  }

  const created = await Mosaic.create(built.payload);
  res.status(201).json(created);
});

const updateMosaic = asyncHandler(async (req, res) => {
  const built = buildMosaicPayload(req.body, req.file);
  if (built.error) {
    return res.status(400).json({ error: built.error });
  }

  const updates = built.payload;
  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) delete updates[key];
  });

  const validationErrors = validatePayload(mosaicUpdateSchema, updates);
  if (validationErrors) {
    return res.status(400).json({ error: 'Validation error', details: validationErrors });
  }

  const updated = await Mosaic.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!updated) return res.status(404).json({ error: 'Not found' });

  res.json(updated);
});

const deleteMosaic = asyncHandler(async (req, res) => {
  const deleted = await Mosaic.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = {
  listMosaics,
  getMosaic,
  createMosaic,
  updateMosaic,
  deleteMosaic,
};
