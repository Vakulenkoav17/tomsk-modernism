const express = require('express');
const rateLimit = require('express-rate-limit');
const { createUpload } = require('../middleware/upload');
const adminAuth = require('../middleware/adminAuth');
const upload = createUpload();
const { uploadImages } = require('../controllers/uploadsController');

const router = express.Router();

const uploadLimiter = rateLimit({
  windowMs: Number(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS) || 5 * 60 * 1000,
  max: Number(process.env.UPLOAD_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many uploads, please try again later.' },
});

router.post('/', adminAuth, uploadLimiter, upload.array('images', 5), uploadImages);

module.exports = router;
