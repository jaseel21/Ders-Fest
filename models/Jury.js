const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // For password hashing

const jurySchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    // Added an array to store references to items assigned to this jury
    assignedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }]
});

// Password hashing before saving the jury
jurySchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const Jury = mongoose.model('Jury', jurySchema);
module.exports = Jury;
