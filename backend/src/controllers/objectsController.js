const mongoose = require('mongoose');
const ObjectModel = require('../models/Object');
const { deleteStoredImage, uploadImage } = require('../services/storage');
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
    year: body.year,
    address: body.address,
    desc: body.desc,
    lat: parseNumber(body.lat, defaults ? 56.4866 : undefined),
    lng: parseNumber(body.lng, defaults ? 84.9719 : undefined),
    isUnique: parseBoolean(body.isUnique, defaults ? false : undefined),
    hasCard: parseBoolean(body.hasCard, defaults ? false : undefined),
    polygonCoords: polygon.value ?? (defaults ? [] : undefined),
    articleBlocks: articles.value ?? (defaults ? [] : undefined),
  };

  return { payload };
};

const listObjects = asyncHandler(async (req, res) => {
  const { limit, excludeId, sample } = req.query;
  const query = {};
  if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
  }

  const parsedLimit = Number(limit);
  const useSample = sample === 'true' || sample === '1';

  let items;
  if (!Number.isNaN(parsedLimit) && parsedLimit > 0 && useSample) {
    items = await ObjectModel.aggregate([
      { $match: query },
      { $sample: { size: parsedLimit } },
      { $addFields: { id: { $toString: '$_id' } } },
      { $project: { __v: 0 } },
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

  let imageUrl = null;
  if (req.file) {
    imageUrl = await uploadImage(req.file, 'objects');
  }

  const payload = { ...built.payload, ...(imageUrl ? { image: imageUrl } : {}) };

  const validationErrors = validatePayload(objectCreateSchema, payload);
  if (validationErrors) {
    if (imageUrl) await deleteStoredImage(imageUrl);
    return res.status(400).json({ error: 'Validation error', details: validationErrors });
  }

  try {
    const created = await ObjectModel.create(payload);
    res.status(201).json(created);
  } catch (err) {
    if (imageUrl) await deleteStoredImage(imageUrl);
    throw err;
  }
});

const updateObject = asyncHandler(async (req, res) => {
  let existing = null;
  if (req.file) {
    existing = await ObjectModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
  }

  const built = buildObjectPayload(req.body, req.file);
  if (built.error) {
    return res.status(400).json({ error: built.error });
  }

  const updates = built.payload;
  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) delete updates[key];
  });

  let newImage = null;
  if (req.file) {
    newImage = await uploadImage(req.file, 'objects');
    updates.image = newImage;
  }

  const validationErrors = validatePayload(objectUpdateSchema, updates);
  if (validationErrors) {
    if (newImage) await deleteStoredImage(newImage);
    return res.status(400).json({ error: 'Validation error', details: validationErrors });
  }

  const updated = await ObjectModel.findByIdAndUpdate(req.params.id, updates, { new: true });
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

const deleteObject = asyncHandler(async (req, res) => {
  const item = await ObjectModel.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });

  await ObjectModel.findByIdAndDelete(req.params.id);
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
  listObjects,
  getObject,
  createObject,
  updateObject,
  deleteObject,
};
