const mongoose = require('mongoose');
const Architect = require('../models/Architect');
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

  if (file) payload.image = `/architects/${file.filename}`;

  return { payload };
};

const listArchitects = asyncHandler(async (req, res) => {
  const { limit, excludeId, sample } = req.query;
  const query = {};
  if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
    query._id = { $ne: excludeId };
  }

  const parsedLimit = Number(limit);
  const useSample = sample === 'true' || sample === '1';

  let items;
  if (!Number.isNaN(parsedLimit) && parsedLimit > 0 && useSample) {
    items = await Architect.aggregate([
      { $match: query },
      { $sample: { size: parsedLimit } },
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

  const validationErrors = validatePayload(architectCreateSchema, built.payload);
  if (validationErrors) {
    return res.status(400).json({ error: 'Validation error', details: validationErrors });
  }

  const created = await Architect.create(built.payload);
  res.status(201).json(created);
});

const updateArchitect = asyncHandler(async (req, res) => {
  const built = buildArchitectPayload(req.body, req.file);
  if (built.error) {
    return res.status(400).json({ error: built.error });
  }

  const updates = built.payload;
  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) delete updates[key];
  });

  const validationErrors = validatePayload(architectUpdateSchema, updates);
  if (validationErrors) {
    return res.status(400).json({ error: 'Validation error', details: validationErrors });
  }

  const updated = await Architect.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!updated) return res.status(404).json({ error: 'Not found' });

  res.json(updated);
});

const deleteArchitect = asyncHandler(async (req, res) => {
  const deleted = await Architect.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = {
  listArchitects,
  getArchitect,
  createArchitect,
  updateArchitect,
  deleteArchitect,
};
