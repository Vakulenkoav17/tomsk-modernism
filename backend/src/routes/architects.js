const express = require('express');
const { createUpload } = require('../middleware/upload');
const upload = createUpload('architects');
const adminAuth = require('../middleware/adminAuth');
const {
  listArchitects,
  getArchitect,
  createArchitect,
  updateArchitect,
  deleteArchitect,
} = require('../controllers/architectsController');

const router = express.Router();

router.get('/', listArchitects);
router.get('/:id', getArchitect);
router.post('/', adminAuth, upload.single('image'), createArchitect);
router.put('/:id', adminAuth, upload.single('image'), updateArchitect);
router.delete('/:id', adminAuth, deleteArchitect);

module.exports = router;
