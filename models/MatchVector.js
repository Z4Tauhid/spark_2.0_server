const mongoose = require('mongoose');

const axisField = { type: Number, min: 0, max: 100, required: true, default: 0 };

const matchVectorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    hardSkills:   axisField,
    softSkills:   axisField,
    domain:       axisField,
    languages:    axisField,
    availability: axisField,
    trajectory:   axisField,
    valuesFit:    axisField,

    // Id of a static, client-side-seeded opportunity — not a Mongo ref.
    expressedInterestId: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MatchVector', matchVectorSchema);
