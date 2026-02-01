const express = require('express');
const objects = require('./objects');
const architects = require('./architects');
const mosaics = require('./mosaics');
const uploads = require('./uploads');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

router.use('/objects', objects);
router.use('/architects', architects);
router.use('/mosaics', mosaics);
router.use('/uploads', uploads);
router.get('/admin/ping', adminAuth, (req, res) => res.json({ ok: true }));

module.exports = router;
