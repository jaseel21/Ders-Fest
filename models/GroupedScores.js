const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GroupedScoresSchema = new Schema({
  itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  itemType: { type: String, required: true },
  itemCategory: { type: String, required: true },
  itemStage: { type: String, required: true },
  scores: [
    {
      contestantId: { type: Schema.Types.ObjectId, ref: 'Contestant', required: true },
      group: { type: String, required: true },
      score: { type: Number, required: true },
      badge: { type: String, default: null },
      createdAt: { type: Date, default: Date.now }
    }
  ]
});

const GroupedScores = mongoose.model('GroupedScores', GroupedScoresSchema);

module.exports = GroupedScores;