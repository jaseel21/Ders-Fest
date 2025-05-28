const mongoose = require('mongoose');

const DashboardSchema = new mongoose.Schema({
    groupName: {
        type: String,
        required: true,
        unique: true // Ensures one dashboard entry per group
    },
    topPerformers: {
        subjunior: [
            {
                name: { type: String, required: true },
                totalPoints: { type: Number, required: true }
            }
        ],
        junior: [
            {
                name: { type: String, required: true },
                totalPoints: { type: Number, required: true }
            }
        ],
        senior: [
            {
                name: { type: String, required: true },
                totalPoints: { type: Number, required: true }
            }
        ]
    },
    groupPoints: {
        First: [
            {
                groupname: { type: String, required: true },
                totalPoints: { type: Number, required: true }
            }
        ],
        Second: [
            {
                groupname: { type: String, required: true },
                totalPoints: { type: Number, required: true }
            }
        ],
        Third: [
            {
                groupname: { type: String, required: true },
                totalPoints: { type: Number, required: true }
            }
        ]
    }
}, { timestamps: true }); // Automatically create createdAt and updatedAt fields

module.exports = mongoose.model('Dashboard', DashboardSchema);
