const express = require('express');
const { createUpload } = require('../middleware/upload');
const upload = createUpload('mosaics');
const adminAuth = require('../middleware/adminAuth');
const {
  listMosaics,
  getMosaic,
  createMosaic,
  updateMosaic,
  deleteMosaic,
} = require('../controllers/mosaicsController');

const router = express.Router();

router.get('/', listMosaics);
router.get('/:id', getMosaic);
router.post('/', adminAuth, upload.single('image'), createMosaic);
router.put('/:id', adminAuth, upload.single('image'), updateMosaic);
router.delete('/:id', adminAuth, deleteMosaic);

module.exports = router;
