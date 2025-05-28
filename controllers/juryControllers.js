const Contestant = require('../models/Contestant');
const Item = require('../models/item');
const Jury = require('../models/Jury');
const GroupedScores = require('../models/GroupedScores');
const Points = require('../models/Points');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

exports.renderLoginPage = (req, res) => {
    res.render('jury/login');
};

// login jury
exports.loginJury = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find the jury by username
        const jury = await Jury.findOne({ username });
        if (!jury) {
            return res.status(400).send('Invalid username or password');
        }

        // Validate the password
        const isMatch = await bcrypt.compare(password, jury.password);
        if (!isMatch) {
            return res.status(400).send('Invalid username or password');
        }

        // Set session or token (using session in this case)
        req.session.juryId = jury._id;
        req.session.juryUsername = jury.username;

        // Redirect to the jury panel
        res.redirect(`/jury/panel/${jury._id}`);
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Error logging in');
    }
};


exports.renderJuryPanel = async (req, res) => {
    try {
        const juryId = req.params.id;

        // Fetch the jury and populate assigned items with participants
        const jury = await Jury.findById(juryId).populate({
            path: 'assignedItems',
            populate: {
                path: 'participants',
                select: 'name groupName contestantNumber' // Fetch necessary fields
            }
        }).lean(); // Use lean() to return plain JavaScript objects

        if (!jury) {
            return res.status(404).send('Jury not found');
        }

        // Fetch grouped scores for the jury's assigned items
        const itemIds = jury.assignedItems.map(item => item._id); // Extract item IDs
        const groupedScores = await GroupedScores.find({ itemId: { $in: itemIds } }).lean(); // Fetch scores for those items

        // Create a mapping of itemId to its scores for easy access
        const scoresMap = groupedScores.reduce((acc, score) => {
            acc[score.itemId] = score.scores; // Map itemId to scores
            return acc;
        }, {});

        // Iterate through the jury's assigned items to structure the data
        jury.assignedItems.forEach(item => {
            item.participants.forEach(participant => {
                // Directly access item details from the item
                participant.itemName = item.name;         // Name of the item
                participant.itemCategory = item.category; // Category of the item
                participant.itemType = item.type;         // Type of the item
                participant.itemStage = item.stage;

                // Add scores and badges for the participant if they exist
                const participantScores = scoresMap[item._id];
                if (participantScores) {
                    const participantScore = participantScores.find(score => score.contestantId.equals(participant._id));
                    if (participantScore) {
                        participant.score = participantScore.score; // Add the score
                        participant.badge = participantScore.badge; // Add the badge
                    } else {
                        participant.score = 0; // Default score if not found
                        participant.badge = null; // No badge if not found
                    }
                } else {
                    participant.score = 0; // Default score if no scores exist
                    participant.badge = null; // No badge if no scores exist
                }

                console.log(`Participant: ${participant.name}, Item: ${participant.itemName}, Category: ${participant.itemCategory}, Type: ${participant.itemType}, Score: ${participant.score}, Badge: ${participant.badge}`);
            });
        });

        // Render the jury panel view and pass the structured data
        res.render('jury/panel', { jury });
    } catch (error) {
        console.error('Error rendering jury panel:', error);
        res.status(500).send('Error rendering jury panel');
    }
};





// Point assigning function
const assignPointsAndBadges = async (groupedScore) => {
    try {
        // Check if the groupedScore or its scores are missing
        if (!groupedScore || !groupedScore.scores) {
            console.warn('No valid grouped score data available');
            return;
        }

        // Filter out contestants with zero or no score
        let validScores = groupedScore.scores.filter(scoreEntry => scoreEntry.score > 0);

        if (validScores.length === 0) {
            return;
        }

        // Sort scores in descending order
        validScores.sort((a, b) => b.score - a.score);

        // Define points for different item types
        const pointsMap = {
            C: { 1: 15, 2: 10, 3: 5 },
            A: { 1: 8, 2: 5, 3: 2 },
            B: { 1: 5, 2: 3, 3: 1 }
        };

        const itemPoints = pointsMap[groupedScore.itemType] || { 1: 0, 2: 0, 3: 0 }; // Default to 0 if itemType is invalid

        // Find or create a Points document for this item
        let pointsDoc = await Points.findOne({ itemId: groupedScore.itemId, category: groupedScore.itemCategory, itemStage: groupedScore.itemStage });

        if (!pointsDoc) {
            pointsDoc = new Points({
                itemId: groupedScore.itemId,
                category: groupedScore.itemCategory,
                itemType: groupedScore.itemType,
                itemStage: groupedScore.itemStage,
                contestants: [],
            });
        } else {
            // Clear old scores for this item before adding the new ones
            pointsDoc.contestants = [];
        }

        // Assign badges and points for the top 3 contestants
        for (let i = 0; i < validScores.length && i < 3; i++) {
            const rank = i + 1;
            const contestant = validScores[i];

            // Log contestant object to inspect its structure
            console.log('Contestant object:', contestant);

            // Assign badge
            const badge = rank === 1 ? 'first' : rank === 2 ? 'second' : 'third';
            contestant.badge = badge;

            // Assign points based on rank and itemType
            const points = itemPoints[rank] || 0;

            // Access contestantNumber correctly
            const contestantNumber = contestant.contestantId?.contestantNumber; // Use optional chaining

            // Log contestantNumber to ensure it's defined
            console.log('Contestant Number:', contestantNumber);

            // Check if contestantNumber is valid
            if (!contestantNumber) {
                throw new Error(`Contestant number is missing or undefined for contestant: ${contestant.contestantId.name}`);
            }

            // Add new contestant points (all old scores have already been cleared)
            pointsDoc.contestants.push({
                contestantId: contestant.contestantId._id,
                contestantNumber: contestantNumber,
                name: contestant.contestantId.name,
                group: contestant.contestantId.groupName,
                rank,
                points,
            });

            console.log(`Assigned '${badge}' badge and ${points} points to contestant: ${contestant.contestantId.name}`);
        }

        // Reset badges and points for contestants beyond the top 3
        for (let i = 3; i < validScores.length; i++) {
            validScores[i].badge = null;
            console.log(`Reset badge for: ${validScores[i].contestantId.name}`);
        }

        // Save the updated points document with the new contestants
        await pointsDoc.save();

        // Save the updated grouped scores
        await groupedScore.save();
    } catch (error) {
        console.error('Error assigning points and badges:', error);
    }
};



exports.saveScores = async (req, res) => {
    try {
        const { scores } = req.body;
        // Validate input data
        if (!scores || !Array.isArray(scores)) {
            return res.status(400).json({ success: false, message: 'Invalid data format' });
        }

        // Process each score entry
        for (const entry of scores) {
            const { contestantId, itemId, itemType, itemCategory, itemStage, groupName, score, badge } = entry;
        
            //in here success contestestant id


            // Ensure all required fields are present
            if (!contestantId || !itemId || !itemType || !itemCategory || !itemStage || !groupName || score === undefined || score === null) {
                console.warn('Missing fields in entry:', entry);
                continue; // Skip invalid entries
            }

            // Parse the score to an integer
            const parsedScore = parseInt(score, 10);
            if (isNaN(parsedScore)) {
                console.warn('Score parsing failed:', score);
                continue;
            }

            // Check if the grouped score for this item already exists
            let groupedScore = await GroupedScores.findOne({ itemId });

            if (!groupedScore) {
                // If not, create a new grouped score entry for this item
                groupedScore = new GroupedScores({
                    itemId,
                    itemType,
                    itemCategory,
                    itemStage,
                    scores: [] // Initialize an empty scores array
                });
            }

            // Find if this contestant already has a score for this item
            const existingScore = groupedScore.scores.find(s => s.contestantId.toString() === contestantId.toString());

            if (existingScore) {
                // If the contestant already has a score, update it
                existingScore.score = parsedScore;
                existingScore.group = groupName; // Update groupName if needed
                existingScore.badge = badge; // Update badge if provided
                existingScore.updatedAt = new Date(); // Track when the score was updated
                console.log(`Score updated for contestant: ${contestantId} for item: ${itemId}`);
            } else {
                // If no score exists for this contestant, add a new entry
                groupedScore.scores.push({
                    contestantId,
                    group: groupName, // Use groupName instead of group
                    score: parsedScore,
                    badge,
                    createdAt: new Date() // Track when the score was saved
                });
                console.log(`New score added for contestant: ${contestantId} for item: ${itemId}`);
            }

            // Save the grouped score document
            await groupedScore.save();
        }

        // After saving scores, handle badge assignment and point assignment
        const itemIds = [...new Set(scores.map(score => score.itemId))]; // Get unique item IDs

        for (const itemId of itemIds) {
            // Fetch all contestants for this item who have a score greater than 0
            let groupedScore = await GroupedScores.findOne({ itemId }).populate('scores.contestantId');
            console.log("Data passed to saveScores: ", groupedScore);



            // If groupedScore does not exist, skip badge assignment
            if (!groupedScore || !groupedScore.scores) {
                console.warn(`No scores found for itemId: ${itemId}`);
                continue;
            }

            // Filter out contestants with zero or no score
            let validScores = groupedScore.scores.filter(scoreEntry => scoreEntry.score > 0);

            if (validScores.length === 0) {
                console.warn(`No valid scores to assign badges for itemId: ${itemId}`);
                continue; // No valid scores, skip badge assignment
            }

            // Sort the remaining contestants by score in descending order
            validScores.sort((a, b) => b.score - a.score); // Sort by score descending

            // Assign badges to top three contestants
            for (let i = 0; i < validScores.length; i++) {
                const badge = i === 0 ? 'first' : i === 1 ? 'second' : i === 2 ? 'third' : null;

                validScores[i].badge = badge;

                if (badge) {
                    console.log(`Assigned '${badge}' badge to: ${validScores[i].contestantId.name}`);
                }
            }

            // Reset badges for contestants beyond the top 3, or those who had zero or no score
            for (let i = 3; i < validScores.length; i++) {
                validScores[i].badge = null;
                console.log(`Reset badge for: ${validScores[i].contestantId.name}`);
            }

            // Save the updated grouped scores with badges
            await groupedScore.save();
            // Call the function to assign points and badges
            await assignPointsAndBadges(groupedScore);
        }

        res.status(200).json({ success: true, message: 'Scores and points updated successfully, badges assigned' });
    } catch (error) {
        console.error('Error updating scores and points:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};





