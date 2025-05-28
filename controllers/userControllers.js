// Import the necessary models (assuming you have models for Item and Participant)
const Item = require('../models/item');  // Import Item model
const Points = require('../models/Points');
const Dashboard = require('../models/Dashboard');
const Results = require('../models/Results');
const PublicResult = require('../models/PublicResult');
// Function to calculate group total points for a single item


exports.getDashboard = async (req, res) => {
    try {
        // Fetch the results from the database
        const results = await Results.findOne({}, 'topPerformers groupPoints topPerformersByGroup');

        // Check if results were found
        if (!results) {
            console.log("No results found.");
            return res.render('user/dashboard', { topPerformers: {}, groupPoints: {}, topPerformersByGroup: [] });
        }


        // Extract the data from the results object
        const { topPerformers = {}, groupPoints = {}, topPerformersByGroup = [] } = results;

        // Safely format topPerformers by category
        const formattedTopPerformers = {
            subjunior: [],
            junior: [],
            senior: [],
        };

        // Helper function to format data safely
        function formatTopPerformers(category, data) {
            if (data && data.length > 0) {
                data.forEach(({ name = "N/A", group = "N/A", totalPoints = 0 }) => {
                    category.push({ name, group, totalPoints });
                });
            } else {
                category.push({ name: "N/A", group: "N/A", totalPoints: 0 }); // Default value if no data
            }
        }

        // Format topPerformers for each category
        formatTopPerformers(formattedTopPerformers.subjunior, topPerformers.subjunior);
        formatTopPerformers(formattedTopPerformers.junior, topPerformers.junior);
        formatTopPerformers(formattedTopPerformers.senior, topPerformers.senior);

        // Format the groupPoints by rank
        const formattedGroupPoints = {
            First: [],
            Second: [],
            Third: [],
        };

        // Helper function to format group points
        function formatGroupPoints(rank, data) {
            if (data && data.length > 0) {
                data.forEach(({ groupname = "N/A", totalPoints = 0 }) => {
                    rank.push({ groupname, totalPoints });
                });
            } else {
                rank.push({ groupname: "N/A", totalPoints: 0 }); // Default value if no data
            }
        }

        // Format group points for each rank
        formatGroupPoints(formattedGroupPoints.First, groupPoints.First);
        formatGroupPoints(formattedGroupPoints.Second, groupPoints.Second);
        formatGroupPoints(formattedGroupPoints.Third, groupPoints.Third);

        // Format topPerformersByGroup
        const formattedTopPerformersByGroup = [];

        topPerformersByGroup.forEach(({ groupname = "N/A", topPerformers = [] }) => {
            const groupData = {
                groupname,
                topPerformers: [],
            };

            // Format top performers within the group
            if (topPerformers && topPerformers.length > 0) {
                topPerformers.forEach(({ contestantId = "N/A", name = "N/A", totalPoints = 0 }) => {
                    groupData.topPerformers.push({ contestantId, name, totalPoints });
                });
            } else {
                groupData.topPerformers.push({ contestantId: "N/A", name: "N/A", totalPoints: 0 }); // Default value if no data
            }

            formattedTopPerformersByGroup.push(groupData);
        });

        // Render the dashboard with the data
        res.render('user/dashboard', {
            topPerformers: formattedTopPerformers,
            groupPoints: formattedGroupPoints,
            topPerformersByGroup: formattedTopPerformersByGroup
        });

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.render('error-loading')
    }
};



const calculateGroupTotalPoints = (pointsDoc) => {
    const groupPoints = {};
    pointsDoc.contestants.forEach(contestant => {
        const { group, points } = contestant;
        groupPoints[group] = (groupPoints[group] || 0) + points;
    });
    return groupPoints;
};


// Helper function to rank and structure group points
const rankGroupPoints = (groupPoints) => {
    // Convert the groupPoints object to an array of objects
    const groupPointsArray = Object.keys(groupPoints).map(groupname => ({
        groupname,
        totalPoints: groupPoints[groupname],
    }));

    // Sort by totalPoints in descending order
    const sortedGroups = groupPointsArray.sort((a, b) => b.totalPoints - a.totalPoints);

    // Structure the ranked results
    return {
        First: sortedGroups[0] ? [sortedGroups[0]] : [],
        Second: sortedGroups[1] ? [sortedGroups[1]] : [],
        Third: sortedGroups[2] ? [sortedGroups[2]] : [],
    };
};



// Function to accumulate points for contestants
const accumulateContestantPoints = async (pointsDocs, contestantTotals) => {
    if (!Array.isArray(pointsDocs)) {
        console.log("pointsDocs is not an array or is undefined.");
        return;
    }

    pointsDocs.forEach(pointsDoc => {
        if (pointsDoc && Array.isArray(pointsDoc.contestants)) {
            const category = pointsDoc.category;
            console.log("Processing category:", category);

            pointsDoc.contestants.forEach(contestant => {
                const contestantId = contestant.contestantId.toString();

                // Initialize contestant data if not already done
                if (!contestantTotals[contestantId]) {
                    contestantTotals[contestantId] = {
                        totalPoints: 0,
                        category: null, // Track the assigned category
                        contestant: contestant,
                    };
                }

                // Check if the contestant is assigned a category
                if (contestantTotals[contestantId].category === null &&
                    ['subjunior', 'junior', 'senior'].includes(category)) {
                    contestantTotals[contestantId].category = category; // Assign the contestant to the category
                }

                // Accumulate points only if contestant is in a valid category and it's not general(group)
                if (contestantTotals[contestantId].category === category &&
                    category !== 'general(group)') {
                    contestantTotals[contestantId].totalPoints += contestant.points;
                }
            });
        } else {
            console.log("pointsDoc.contestants is not an array or is undefined for pointsDoc:", pointsDoc);
        }
    });
};

// Function to add general(individual) points to total points for contestants

const addGeneralIndividualPoints = (contestantTotals, generalPointsDocs) => {
    generalPointsDocs.forEach(generalDoc => {
        if (generalDoc && Array.isArray(generalDoc.contestants)) {
            generalDoc.contestants.forEach((generalContestant, index) => {
                const contestantId = generalContestant.contestantId.toString();

                // Check if the contestant exists in contestantTotals
                if (contestantTotals[contestantId]) {
                    let pointsToAdd = 0;

                    // Assign points based on the rank (index)
                    if (index === 0) {
                        pointsToAdd = 5; // First place: 5 points
                    } else if (index === 1) {
                        pointsToAdd = 3; // Second place: 3 points
                    } else if (index === 2) {
                        pointsToAdd = 1; // Third place: 1 point
                    }

                    // Add the points to the contestant's total
                    contestantTotals[contestantId].totalPoints += pointsToAdd;
                    console.log(`Added "general(individual)" points for ${contestantId}:`, contestantTotals[contestantId].totalPoints);
                }
            });
        } else {
            console.log("generalDoc.contestants is not an array or is undefined for generalDoc:", generalDoc);
        }
    });
};



// Function to find top contestants in each category based on total points in that category
const findTopContestantsInEachCategory = (contestantTotals) => {
    const topContestants = {
        subjunior: null,
        junior: null,
        senior: null
    };

    for (const contestantId in contestantTotals) {
        const contestantData = contestantTotals[contestantId];

        // Log each contestant for debugging
        console.log(`Evaluating contestant ${contestantId}:`, contestantData);

        // Check if the contestant has a valid category
        const category = contestantData.category;

        if (category && topContestants.hasOwnProperty(category)) {
            // Check if the current contestant has more points than the stored top contestant
            const isTopPerformer = !topContestants[category] || contestantData.totalPoints > topContestants[category].totalPoints;

            if (isTopPerformer) {
                topContestants[category] = {
                    contestantId,
                    totalPoints: contestantData.totalPoints,
                    group: contestantData.contestant.group,
                    name: contestantData.contestant.name,
                    contestantNumber: contestantData.contestant.contestantNumber
                };
                console.log(`Updated top performer for category ${category}:`, topContestants[category]);
            }
        }
    }

    return topContestants;
};





// Function to find top 3 performers in each group based on total points
const findTopPerformersInEachGroup = (contestantTotals) => {
    const topPerformersByGroup = [];
    const groupMap = {}; // Temporarily store contestants by group name

    for (const contestantId in contestantTotals) {
        const contestantData = contestantTotals[contestantId];

        // Log each contestant for debugging
        console.log(`Evaluating contestant ${contestantId}:`, contestantData);

        // Extract group and other relevant data
        const group = contestantData.contestant.group;
        const totalPoints = contestantData.totalPoints;
        const name = contestantData.contestant.name;
        const contestantNumber = contestantData.contestantNumber;

        // Check if group and totalPoints exist
        if (group && totalPoints !== undefined) {
            // Initialize the group array in the map if it doesn't exist yet
            if (!groupMap[group]) {
                groupMap[group] = [];
            }

            // Add the contestant to the group array in groupMap
            groupMap[group].push({
                contestantId,
                totalPoints,
                name,
                contestantNumber
            });
        } else {
            console.log(`Missing data for contestant ${contestantId}:`, contestantData);
        }
    }

    // Sort and get top 3 performers in each group
    for (const group in groupMap) {
        // Sort the contestants in descending order of points
        const topFivePerformers = groupMap[group]
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, 3); // Select the top 3 performers

        // Push the result for each group into topPerformersByGroup
        topPerformersByGroup.push({
            groupname: group,
            topPerformers: topFivePerformers
        });

        console.log(`Top 3 performers in group ${group}:`, topFivePerformers);
    }

    return topPerformersByGroup;
};





// Main function that combines the three helper functions
exports.calculateMultipleItems = async (req, res) => {
    console.log('Received body:', req.body);

    try {
        const { itemIds } = req.body;
        if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
            return res.status(400).json({ error: 'Invalid item IDs provided' });
        }
        const io = req.app.get('io'); // Retrieve the `io` object from the app
        let contestantTotals = {};
        let groupPoints = {};


        // Clear the old data in PublicResult before inserting new data
        await PublicResult.deleteMany({ itemId: { $in: itemIds } });  // This will delete all documents with the given itemIds


        for (const itemId of itemIds) {
            console.log(`Processing item ID: ${itemId}`);

            // Fetch points document for the current item
            const pointsDoc = await Points.findOne({ itemId });

            if (!pointsDoc) {
                console.warn(`No points found for item ID ${itemId}.`);
                continue;
            }

            // Accumulate contestant points
            await accumulateContestantPoints([pointsDoc], contestantTotals);

            // Calculate group points for the current document
            const itemGroupPoints = calculateGroupTotalPoints(pointsDoc);

            // Accumulate group points
            for (const [groupName, points] of Object.entries(itemGroupPoints)) {
                groupPoints[groupName] = (groupPoints[groupName] || 0) + points;
            }

            // Prepare data for saving into PublicResult collection
            const publicResultData = {
                itemId: pointsDoc.itemId,
                category: pointsDoc.category,
                itemType: pointsDoc.itemType,
                itemStage: pointsDoc.itemStage,
                contestants: pointsDoc.contestants.map(contestant => ({
                    contestantId: contestant.contestantId,
                    contestantNumber: contestant.contestantNumber,
                    name: contestant.name,
                    group: contestant.group,
                    rank: contestant.rank,
                    points: contestant.points, // This will be accumulated if required
                })),
            };

            // Save to PublicResult collection
            const publicResult = new PublicResult(publicResultData);
            await publicResult.save();

        }

        // Rank the group points
        const rankedGroupPoints = rankGroupPoints(groupPoints);

        // Fetch only "general(individual)" documents that match itemIds in the request
        const generalPointsDocs = await Points.find({
            itemId: { $in: itemIds },
            category: 'general(individual)'
        });

        // Add "general(individual)" points to contestant totals for the specified items
        addGeneralIndividualPoints(contestantTotals, generalPointsDocs);

        // Fetch top performers in each category based on the accumulated totals
        const topPerformers = findTopContestantsInEachCategory(contestantTotals);


        // Get top 5 performers for each group
        const topPerformersByGroup = findTopPerformersInEachGroup(contestantTotals);


        console.log("Final Group Points:", groupPoints);
        console.log("Final Top Performers:", topPerformers);
        console.log('topPerformersByGroup:', topPerformersByGroup);

        // Check if results already exist in the database to avoid duplicates
        const existingResult = await Results.findOne({ /* conditions to find existing result */ });

        if (existingResult) {
            // Update existing result
            existingResult.topPerformers = topPerformers;
            existingResult.groupPoints = rankedGroupPoints;
            existingResult.topPerformersByGroup = topPerformersByGroup; //
            await existingResult.save();

            // Emit an update event through Socket.IO
            io.emit('results-updated', {
                groupPoints: rankedGroupPoints,
                topPerformers,
                topPerformersByGroup,
            });

        } else {
            // Save the results to the database
            const resultEntry = new Results({
                topPerformers,
                topPerformersByGroup,
                groupPoints: rankedGroupPoints,
            });
            await resultEntry.save();
            // Emit a new results event through Socket.IO
            io.emit('results-saved', {
                groupPoints: rankedGroupPoints,
                topPerformers,
                topPerformersByGroup,
            });
        }

        // Send response with the results
        res.json({ groupPoints, topPerformers, topPerformersByGroup });

    } catch (error) {
        console.error('Error in calculateMultipleItems:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


