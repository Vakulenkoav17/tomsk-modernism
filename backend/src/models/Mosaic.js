const mongoose = require('mongoose');

const mosaicSchema = new mongoose.Schema(
  {
    name: String,
    author: String,
    year: Number,
    location: String,
    desc: String,
    image: String,
    lat: Number,
    lng: Number,
    polygonCoords: [mongoose.Schema.Types.Mixed],
    isUnique: Boolean,
    hasCard: Boolean,
    articleBlocks: [mongoose.Schema.Types.Mixed],
  },
  { timestamps: true }
);

mosaicSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
  },
});

module.exports = mongoose.model('Mosaic', mosaicSchema);
