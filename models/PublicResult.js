const mongoose = require('mongoose');

const publicResultSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true,
    },
    category: {
        type: String,
        enum: ['subjunior', 'junior', 'senior', 'general(individual)', 'general(group)'],
        required: true,
    },
    itemType: {
        type: String,
        enum: ['C', 'A', 'B'],
        required: true,
    },
    itemStage: {
        type: String,
        enum: ['stage', 'offstage'],
        required: true,
    },
    contestants: [
        {
            contestantId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Contestant',
                required: true,
            },
            contestantNumber: {
                type: String,
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
            group: {
                type: String,
                required: true
            },
            rank: {
                type: Number,
                enum: [1, 2, 3],  // Rank can only be 1 (first), 2 (second), or 3 (third)
                required: true,
            },
            points: {
                type: Number,
                default: 0,  // Points will be calculated based on item type and rank
            },
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Check if the model already exists to prevent overwriting
const PublicResult = mongoose.models.PublicResult || mongoose.model('PublicResult', publicResultSchema);

module.exports = PublicResult;
