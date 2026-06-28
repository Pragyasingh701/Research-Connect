import mongoose from 'mongoose';

const researchAreaSchema = new mongoose.Schema(
  {
    areaName: {
      type: String,
      required: [true, 'Research area name is required'],
      unique: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Text Index for full-text search
researchAreaSchema.index({ areaName: 'text', description: 'text' });

// Pre-save hook to generate URL slug from areaName
researchAreaSchema.pre('save', function (next) {
  if (this.isModified('areaName')) {
    this.slug = this.areaName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-');
  }
  next();
});

const ResearchArea = mongoose.model('ResearchArea', researchAreaSchema);
export default ResearchArea;
