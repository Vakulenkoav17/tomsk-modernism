const mongoose = require('mongoose');

const objectSchema = new mongoose.Schema(
  {
    name: String,
    architect: String,
    year: Number,
    address: String,
    desc: String,
    image: String,
    lat: Number,
    lng: Number,
    isUnique: Boolean,
    hasCard: Boolean,
    polygonCoords: [mongoose.Schema.Types.Mixed],
    articleBlocks: [mongoose.Schema.Types.Mixed],
  },
  { timestamps: true }
);

objectSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
  },
});

module.exports = mongoose.model('Object', objectSchema);
