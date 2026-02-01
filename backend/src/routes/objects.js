const express = require('express');
const { createUpload } = require('../middleware/upload');
const upload = createUpload('objects');
const adminAuth = require('../middleware/adminAuth');
const {
  listObjects,
  getObject,
  createObject,
  updateObject,
  deleteObject,
} = require('../controllers/objectsController');

const router = express.Router();

router.get('/', listObjects);
router.get('/:id', getObject);
router.post('/', adminAuth, upload.single('image'), createObject);
router.put('/:id', adminAuth, upload.single('image'), updateObject);
router.delete('/:id', adminAuth, deleteObject);

module.exports = router;
