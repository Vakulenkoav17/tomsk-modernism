const express = require('express');
const upload = require('../middleware/upload');
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
router.post('/', upload.single('image'), createMosaic);
router.put('/:id', upload.single('image'), updateMosaic);
router.delete('/:id', deleteMosaic);

module.exports = router;
