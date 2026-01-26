const mongoose = require('mongoose');
const ObjectModel = require('../models/Object');
const asyncHandler = require('../middleware/asyncHandler');
const { parseBoolean, parseNumber, parseJsonArray } = require('../utils/parse');
const { objectCreateSchema, objectUpdateSchema } = require('../validators/schemas');

const validatePayload = (schema, payload) => {
  const { error } = schema.validate(payload, { abortEarly: false });
  if (!error) return null;
  return error.details.map((detail) => detail.message);
};

const buildObjectPayload = (body, file, { defaults = false } = {}) => {
  const polygon = parseJsonArray(body.polygonCoords);
  if (polygon.error) return { error: 'polygonCoords must be a JSON array' };

  const articles = parseJsonArray(body.articleBlocks);
  if (articles.error) return { error: 'articleBlocks must be a JSON array' };

  const payload = {
    name: body.name,
    architect: body.architect,
    year: parseNumber(body.year, undefined),
    address: body.address,
    desc: body.desc,
    lat: parseNumber(body.lat, defaults ? 56.4866 : undefined),
    lng: parseNumber(body.lng, defaults ? 84.9719 : undefined),
    isUnique: parseBoolean(body.isUnique, false),
    hasCard: parseBoolean(body.hasCard, false),
    polygonCoords: polygon.value ?? (defaults ? [] : undefined),
    articleBlocks: articles.value ?? (defaults ? [] : undefined),
  };

  if (file) payload.image = `/objects/${file.filename}`;

  return { payload };
};

const listObjects = asyncHandler(async (req, res) => {
  const { limit, excludeId, sample } = req.query;
  const query = {};
  if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
    query._id = { $ne: excludeId };
  }

  const parsedLimit = Number(limit);
  const useSample = sample === 'true' || sample === '1';

  let items;
  if (!Number.isNaN(parsedLimit) && parsedLimit > 0 && useSample) {
    items = await ObjectModel.aggregate([
      { $match: query },
      { $sample: { size: parsedLimit } },
    ]);
  } else {
    const cursor = ObjectModel.find(query);
    if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
      cursor.limit(parsedLimit);
    }
    items = await cursor;
  }
  res.json(items);
});

const getObject = asyncHandler(async (req, res) => {
  const item = await ObjectModel.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

const createObject = asyncHandler(async (req, res) => {
  const built = buildObjectPayload(req.body, req.file, { defaults: true });
  if (built.error) {
    return res.status(400).json({ error: built.error });
  }

  const validationErrors = validatePayload(objectCreateSchema, built.payload);
  if (validationErrors) {
    return res.status(400).json({ error: 'Validation error', details: validationErrors });
  }

  const created = await ObjectModel.create(built.payload);
  res.status(201).json(created);
});

const updateObject = asyncHandler(async (req, res) => {
  const built = buildObjectPayload(req.body, req.file);
  if (built.error) {
    return res.status(400).json({ error: built.error });
  }

  const updates = built.payload;
  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) delete updates[key];
  });

  const validationErrors = validatePayload(objectUpdateSchema, updates);
  if (validationErrors) {
    return res.status(400).json({ error: 'Validation error', details: validationErrors });
  }

  const updated = await ObjectModel.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!updated) return res.status(404).json({ error: 'Not found' });

  res.json(updated);
});

const deleteObject = asyncHandler(async (req, res) => {
  const deleted = await ObjectModel.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = {
  listObjects,
  getObject,
  createObject,
  updateObject,
  deleteObject,
};
