import mongoose from 'mongoose';

const researchTaxonomySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Taxonomy node name is required'],
      unique: true,
      trim: true,
      index: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResearchTaxonomy',
      default: null,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    level: {
      type: Number,
      default: 0,
    },
    path: {
      type: String, // Materialized path (e.g., ",Computer Science,Artificial Intelligence,")
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate level and path based on parent
researchTaxonomySchema.pre('save', async function (next) {
  if (this.isModified('parent')) {
    if (this.parent) {
      const parentNode = await this.constructor.findById(this.parent);
      if (parentNode) {
        this.level = parentNode.level + 1;
        this.path = `${parentNode.path || ''}${parentNode.name},`;
      }
    } else {
      this.level = 0;
      this.path = ',';
    }
  }
  next();
});

const ResearchTaxonomy = mongoose.model('ResearchTaxonomy', researchTaxonomySchema);
export default ResearchTaxonomy;
