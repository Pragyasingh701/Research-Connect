import mongoose from 'mongoose';

const collaborationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Collaboration project title is required'],
      trim: true,
    },
    researchArea: {
      type: String,
      required: [true, 'Research area is required'],
      trim: true,
    },
    purpose: {
      type: String,
      required: [true, 'Purpose is required'],
      trim: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Paused'],
      default: 'Active',
      index: true,
    },
    timeline: {
      type: String,
      default: '',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    files: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    messages: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    meetings: [
      {
        title: { type: String, required: true },
        date: { type: Date, required: true },
        link: { type: String, default: '' },
        description: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index on members to quickly fetch collaborations a user is part of
collaborationSchema.index({ members: 1 });

const Collaboration = mongoose.model('Collaboration', collaborationSchema);
export default Collaboration;
