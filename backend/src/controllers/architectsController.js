const mongoose = require('mongoose');
const Architect = require('../models/Architect');
const { deleteStoredImage, uploadImage } = require('../services/storage');
const asyncHandler = require('../middleware/asyncHandler');
const { parseJsonArray } = require('../utils/parse');
const { architectCreateSchema, architectUpdateSchema } = require('../validators/schemas');

const validatePayload = (schema, payload) => {
  const { error } = schema.validate(payload, { abortEarly: false });
  if (!error) return null;
  return error.details.map((detail) => detail.message);
};

const buildArchitectPayload = (body, file, { defaults = false } = {}) => {
  const articles = parseJsonArray(body.articleBlocks);
  if (articles.error) return { error: 'articleBlocks must be a JSON array' };

  const payload = {
    name: body.name,
    years: body.years,
    bio: body.bio,
    articleBlocks: articles.value ?? (defaults ? [] : undefined),
  };

  return { payload };
};

const listArchitects = asyncHandler(async (req, res) => {
  const { limit, excludeId, sample } = req.query;
  const query = {};
  if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
  }

  const parsedLimit = Number(limit);
  const useSample = sample === 'true' || sample === '1';

  let items;
  if (!Number.isNaN(parsedLimit) && parsedLimit > 0 && useSample) {
    items = await Architect.aggregate([
      { $match: query },
      { $sample: { size: parsedLimit } },
      { $addFields: { id: { $toString: '$_id' } } },
      { $project: { __v: 0 } },
    ]);
  } else {
    const cursor = Architect.find(query);
    if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
      cursor.limit(parsedLimit);
    }
    items = await cursor;
  }
  res.json(items);
});

const getArchitect = asyncHandler(async (req, res) => {
  const item = await Architect.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

const createArchitect = asyncHandler(async (req, res) => {
  const built = buildArchitectPayload(req.body, req.file, { defaults: true });
  if (built.error) {
    return res.status(400).json({ error: built.error });
  }

  let imageUrl = null;
  if (req.file) {
    imageUrl = await uploadImage(req.file, 'architects');
  }

  const payload = { ...built.payload, ...(imageUrl ? { image: imageUrl } : {}) };

  const validationErrors = validatePayload(architectCreateSchema, payload);
  if (validationErrors) {
    if (imageUrl) await deleteStoredImage(imageUrl);
    return res.status(400).json({ error: 'Validation error', details: validationErrors });
  }

  try {
    const created = await Architect.create(payload);
    res.status(201).json(created);
  } catch (err) {
    if (imageUrl) await deleteStoredImage(imageUrl);
    throw err;
  }
});

const updateArchitect = asyncHandler(async (req, res) => {
  let existing = null;
  if (req.file) {
    existing = await Architect.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
  }

  const built = buildArchitectPayload(req.body, req.file);
  if (built.error) {
    return res.status(400).json({ error: built.error });
  }

  const updates = built.payload;
  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) delete updates[key];
  });

  let newImage = null;
  if (req.file) {
    newImage = await uploadImage(req.file, 'architects');
    updates.image = newImage;
  }

  const validationErrors = validatePayload(architectUpdateSchema, updates);
  if (validationErrors) {
    if (newImage) await deleteStoredImage(newImage);
    return res.status(400).json({ error: 'Validation error', details: validationErrors });
  }

  const updated = await Architect.findByIdAndUpdate(req.params.id, updates, { new: true });
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

const deleteArchitect = asyncHandler(async (req, res) => {
  const item = await Architect.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });

  await Architect.findByIdAndDelete(req.params.id);
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
  listArchitects,
  getArchitect,
  createArchitect,
  updateArchitect,
  deleteArchitect,
};
