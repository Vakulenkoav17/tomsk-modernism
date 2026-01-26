const express = require('express');
const upload = require('../middleware/upload');
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
router.post('/', upload.single('image'), createObject);
router.put('/:id', upload.single('image'), updateObject);
router.delete('/:id', deleteObject);

module.exports = router;
