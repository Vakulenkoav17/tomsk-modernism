const express = require('express');
const upload = require('../middleware/upload');
const { uploadImages } = require('../controllers/uploadsController');

const router = express.Router();

router.post('/', upload.array('images', 5), uploadImages);

module.exports = router;
