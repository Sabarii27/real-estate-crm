const mongoose = require('mongoose');

const buildingSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    name: { type: String, required: [true, 'Building name is required'], trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true }
);

buildingSchema.index({ project: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Building', buildingSchema);
