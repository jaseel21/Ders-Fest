var express = require('express');
var router = express.Router();
const userController = require('../controllers/userControllers');
const PublicResult = require('../models/PublicResult');
const Contestant = require('../models/Contestant');
const Item = require('../models/item');
/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('user/dashboard');
// });
router.get('/', userController.getDashboard);

router.post('/user/calculate-multiple', async (req, res, next) => {
    try {
        const result = await userController.calculateMultipleItems(req, res, next);
        res.json(result); // Send JSON response
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route to handle the contestant number search and render results 
router.post('/user/results', async (req, res) => {
    const { contestantNumber } = req.body;

    try {
        // Step 1: Fetch the contestant details using contestant number
        const contestantDetails = await Contestant.findOne({ contestantNumber });

        if (!contestantDetails) {
            return res.render('user/results', {
                message: 'Contestant not found.'
            });
        }

        // Step 2: Fetch the results (PublicResult) for the contestant using the contestant's number
        const publicResults = await PublicResult.find({
            'contestants.contestantNumber': contestantNumber
        });

        if (publicResults.length > 0) {
            // Step 3: Process results and accumulate points for C, A, and B categories
            const formattedResults = await Promise.all(publicResults.map(async (result) => {

                // Initialize point categories for C, A, and B
                const CType = { first: 0, second: 0, third: 0 };
                const AType = { first: 0, second: 0, third: 0 };
                const BType = { first: 0, second: 0, third: 0 };

                // Step 4: Iterate through contestants and categorize by rank and type
                result.contestants.forEach(contestant => {
                    if (contestant.contestantNumber === contestantNumber) {

                        // Use `result.itemType` instead of `contestant.itemType`
                        if (result.itemType === 'C') {
                            if (contestant.rank === 1) {
                                CType.first = contestant.points;
                            } else if (contestant.rank === 2) {
                                CType.second = contestant.points;
                            } else if (contestant.rank === 3) {
                                CType.third = contestant.points;
                            }
                        } else if (result.itemType === 'A') {
                            if (contestant.rank === 1) {
                                AType.first = contestant.points;
                            } else if (contestant.rank === 2) {
                                AType.second = contestant.points;
                            } else if (contestant.rank === 3) {
                                AType.third = contestant.points;
                            }
                        } else if (result.itemType === 'B') {
                            if (contestant.rank === 1) {
                                BType.first = contestant.points;
                            } else if (contestant.rank === 2) {
                                BType.second = contestant.points;
                            } else if (contestant.rank === 3) {
                                BType.third = contestant.points;
                            }
                        }
                    }
                });

                // Step 5: Fetch the item name using the itemId
                const item = await Item.findById(result.itemId);
                console.log('Fetched Item:', item ? item.name : 'Unknown Item');

                // Step 6: Return the formatted result with the item name and points
                return {
                    item: item ? item.name : 'Unknown Item',
                    CType,
                    AType,
                    BType
                };
            }));

            // Render the results page with the formatted data
            res.render('user/results', {
                results: formattedResults,
                contestantName: contestantDetails.name,
                contestantNumber: contestantDetails.contestantNumber,
            });
        } else {
            res.render('user/results', {
                message: 'No results found for this contestant number.'
            });
        }
    } catch (error) {
        console.error('Error fetching results:', error);
        res.render('user/results', {
            message: 'An error occurred while fetching the results.'
        });
    }
});


// Route to handle the group name search and render results
router.post('/user/group-results', async (req, res) => {
    const { groupName } = req.body;

    try {
        // Step 1: Fetch all contestants in the specified group
        const groupContestants = await Contestant.find({ groupName });

        if (!groupContestants.length) {
            return res.render('user/group-results', {
                message: 'Group not found or no contestants in this group.'
            });
        }

        // Step 2: Fetch results (PublicResult) for contestants in the specified group
        const contestantNumbers = groupContestants.map(contestant => contestant.contestantNumber);
        const groupResults = await PublicResult.find({
            'contestants.contestantNumber': { $in: contestantNumbers }
        });

        if (groupResults.length > 0) {
            // Step 3: Process results to accumulate points for each type by rank (C, A, B)
            const formattedResults = await Promise.all(groupResults.map(async (result) => {
                // Initialize point categories for C, A, and B
                const CType = { first: 0, second: 0, third: 0 };
                const AType = { first: 0, second: 0, third: 0 };
                const BType = { first: 0, second: 0, third: 0 };

                result.contestants.forEach(contestant => {
                    if (contestantNumbers.includes(contestant.contestantNumber)) {
                        // Check the item type and rank, then assign points
                        if (result.itemType === 'C') {
                            if (contestant.rank === 1) CType.first += contestant.points;
                            if (contestant.rank === 2) CType.second += contestant.points;
                            if (contestant.rank === 3) CType.third += contestant.points;
                        } else if (result.itemType === 'A') {
                            if (contestant.rank === 1) AType.first += contestant.points;
                            if (contestant.rank === 2) AType.second += contestant.points;
                            if (contestant.rank === 3) AType.third += contestant.points;
                        } else if (result.itemType === 'B') {
                            if (contestant.rank === 1) BType.first += contestant.points;
                            if (contestant.rank === 2) BType.second += contestant.points;
                            if (contestant.rank === 3) BType.third += contestant.points;
                        }
                    }
                });

                // Fetch item name using the itemId
                const item = await Item.findById(result.itemId);
                return {
                    item: item ? item.name : 'Unknown Item',
                    CType,
                    AType,
                    BType
                };
            }));

            // Render results for the specified group name
            res.render('user/group-results', {
                results: formattedResults,
                groupName,
            });
        } else {
            res.render('user/group-results', {
                message: 'No results found for this group.'
            });
        }
    } catch (error) {
        console.error('Error fetching group results:', error);
        res.render('user/group-results', {
            message: 'An error occurred while fetching the results.'
        });
    }
});






module.exports = router;
