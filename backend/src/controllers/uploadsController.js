const asyncHandler = require('../middleware/asyncHandler');

const uploadImages = asyncHandler(async (req, res) => {
  const folder = req.body.type || 'objects';
  const files = (req.files || []).map((file) => `/${folder}/${file.filename}`);
  res.json({ files });
});

module.exports = {
  uploadImages,
};
