const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['subjunior', 'junior', 'senior', 'general(individual)', 'general(group)'], required: true },
  type: { type: String, enum: ['C', 'A', 'B'], required: true }, // Add type field
  stage: { type: String, enum: ['stage', 'offstage'], required: true }, // Add stage field
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contestant' }], // Array of contestants
  isChecked: { type: Boolean, default: false },
});

module.exports = mongoose.model('Item', ItemSchema);
