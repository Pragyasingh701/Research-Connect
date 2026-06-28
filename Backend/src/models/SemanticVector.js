import mongoose from 'mongoose';

const semanticVectorSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ['Publication', 'Profile'],
      required: true,
      index: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    vector: {
      type: [Number],
      required: [true, 'Embedding vector is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness per target
semanticVectorSchema.index({ targetType: 1, referenceId: 1 }, { unique: true });

const SemanticVector = mongoose.model('SemanticVector', semanticVectorSchema);
export default SemanticVector;
