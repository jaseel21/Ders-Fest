// const mongoose = require('mongoose');

// const ResultsSchema = new mongoose.Schema(
//     {
//         topPerformers: {
//             subjunior: [
//                 {
//                     contestantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contestant', required: true, },
//                     contestantNumber: { type: String, required: true, },
//                     name: { type: String, required: true },
//                     group: { type: String, required: true },
//                     totalPoints: { type: Number, required: true },
//                 },
//             ],
//             junior: [
//                 {
//                     contestantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contestant', required: true, },
//                     contestantNumber: { type: String, required: true, },
//                     name: { type: String, required: true },
//                     group: { type: String, required: true },
//                     totalPoints: { type: Number, required: true },
//                 },
//             ],
//             senior: [
//                 {
//                     contestantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contestant', required: true, },
//                     contestantNumber: { type: String, required: true, },
//                     name: { type: String, required: true },
//                     group: { type: String, required: true },
//                     totalPoints: { type: Number, required: true },
//                 },
//             ],
//         },
//         groupPoints: {
//             First: [
//                 {
//                     groupname: { type: String, required: true },
//                     totalPoints: { type: Number, required: true },
//                     topPerformers: [
//                         {
//                             contestantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contestant', required: true },
//                             name: { type: String, required: true },
//                             totalPoints: { type: Number, required: true },
//                         },
//                     ],
//                 },
//             ],
//             Second: [
//                 {
//                     groupname: { type: String, required: true },
//                     totalPoints: { type: Number, required: true },
//                     topPerformers: [
//                         {
//                             contestantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contestant', required: true },
//                             name: { type: String, required: true },
//                             totalPoints: { type: Number, required: true },
//                         },
//                     ],
//                 },
//             ],
//             Third: [
//                 {
//                     groupname: { type: String, required: true },
//                     totalPoints: { type: Number, required: true },
//                     topPerformers: [
//                         {
//                             contestantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contestant', required: true },
//                             name: { type: String, required: true },
//                             totalPoints: { type: Number, required: true },
//                         },
//                     ],
//                 },
//             ],
//         },
//         topPerformersByGroup: {
//             groupname: { type: String, required: true },
//             topPerformers: [
//                 {
//                     contestantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contestant', required: true },
//                     name: { type: String, required: true },
//                     totalPoints: { type: Number, required: true },
//                 },
//             ],
//         },
//     },
//     { timestamps: true } // Adds createdAt and updatedAt timestamps
// );

// const Results = mongoose.model('Results', ResultsSchema);

// module.exports = Results;
const mongoose = require('mongoose');

const ResultsSchema = new mongoose.Schema(
    {
        topPerformers: {
            subjunior: [
                {
                    contestantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contestant', required: true },
                    contestantNumber: { type: String, required: true },
                    name: { type: String, required: true },
                    group: { type: String, required: true },
                    totalPoints: { type: Number, required: true },
                },
            ],
            junior: [
                {
                    contestantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contestant', required: true },
                    contestantNumber: { type: String, required: true },
                    name: { type: String, required: true },
                    group: { type: String, required: true },
                    totalPoints: { type: Number, required: true },
                },
            ],
            senior: [
                {
                    contestantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contestant', required: true },
                    contestantNumber: { type: String, required: true },
                    name: { type: String, required: true },
                    group: { type: String, required: true },
                    totalPoints: { type: Number, required: true },
                },
            ],
        },
        groupPoints: {
            First: [
                {
                    groupname: { type: String, required: true },
                    totalPoints: { type: Number, required: true },
                },
            ],
            Second: [
                {
                    groupname: { type: String, required: true },
                    totalPoints: { type: Number, required: true },
                },
            ],
            Third: [
                {
                    groupname: { type: String, required: true },
                    totalPoints: { type: Number, required: true },
                },
            ],
        },
        topPerformersByGroup: [
            {
                groupname: { type: String, required: true },
                topPerformers: [
                    {
                        contestantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contestant', required: true },
                        name: { type: String, required: true },
                        totalPoints: { type: Number, required: true },
                    },
                ],
            },
        ],
    },
    { timestamps: true } // Adds createdAt and updatedAt timestamps
);

const Results = mongoose.model('Results', ResultsSchema);

module.exports = Results;
