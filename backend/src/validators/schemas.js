const Joi = require('joi');

const objectCreateSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  architect: Joi.string().allow('').optional(),
  year: Joi.number().integer().min(0).optional(),
  address: Joi.string().trim().min(1).required(),
  desc: Joi.string().allow('').optional(),
  image: Joi.string().allow(null, '').optional(),
  lat: Joi.number().optional(),
  lng: Joi.number().optional(),
  isUnique: Joi.boolean().optional(),
  hasCard: Joi.boolean().optional(),
  polygonCoords: Joi.array().optional(),
  articleBlocks: Joi.array().optional(),
});

const objectUpdateSchema = Joi.object({
  name: Joi.string().trim().min(1).optional(),
  architect: Joi.string().allow('').optional(),
  year: Joi.number().integer().min(0).optional(),
  address: Joi.string().trim().min(1).optional(),
  desc: Joi.string().allow('').optional(),
  image: Joi.string().allow(null, '').optional(),
  lat: Joi.number().optional(),
  lng: Joi.number().optional(),
  isUnique: Joi.boolean().optional(),
  hasCard: Joi.boolean().optional(),
  polygonCoords: Joi.array().optional(),
  articleBlocks: Joi.array().optional(),
}).min(1);

const architectCreateSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  years: Joi.string().allow('').optional(),
  bio: Joi.string().allow('').optional(),
  image: Joi.string().allow(null, '').optional(),
  articleBlocks: Joi.array().optional(),
});

const architectUpdateSchema = Joi.object({
  name: Joi.string().trim().min(1).optional(),
  years: Joi.string().allow('').optional(),
  bio: Joi.string().allow('').optional(),
  image: Joi.string().allow(null, '').optional(),
  articleBlocks: Joi.array().optional(),
}).min(1);

const mosaicCreateSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  author: Joi.string().allow('').optional(),
  year: Joi.number().integer().min(0).optional(),
  location: Joi.string().trim().min(1).required(),
  desc: Joi.string().allow('').optional(),
  image: Joi.string().allow(null, '').optional(),
  lat: Joi.number().optional(),
  lng: Joi.number().optional(),
  polygonCoords: Joi.array().optional(),
  isUnique: Joi.boolean().optional(),
  hasCard: Joi.boolean().optional(),
  articleBlocks: Joi.array().optional(),
});

const mosaicUpdateSchema = Joi.object({
  name: Joi.string().trim().min(1).optional(),
  author: Joi.string().allow('').optional(),
  year: Joi.number().integer().min(0).optional(),
  location: Joi.string().trim().min(1).optional(),
  desc: Joi.string().allow('').optional(),
  image: Joi.string().allow(null, '').optional(),
  lat: Joi.number().optional(),
  lng: Joi.number().optional(),
  polygonCoords: Joi.array().optional(),
  isUnique: Joi.boolean().optional(),
  hasCard: Joi.boolean().optional(),
  articleBlocks: Joi.array().optional(),
}).min(1);

module.exports = {
  objectCreateSchema,
  objectUpdateSchema,
  architectCreateSchema,
  architectUpdateSchema,
  mosaicCreateSchema,
  mosaicUpdateSchema,
};
