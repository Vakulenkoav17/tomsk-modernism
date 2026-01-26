const mongoose = require('mongoose');

const architectSchema = new mongoose.Schema(
  {
    name: String,
    years: String,
    bio: String,
    image: String,
    articleBlocks: [mongoose.Schema.Types.Mixed],
  },
  { timestamps: true }
);

architectSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
  },
});

module.exports = mongoose.model('Architect', architectSchema);
