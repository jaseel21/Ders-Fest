const Contestant = require('../models/Contestant');
const Item = require('../models/item');
const Jury = require('../models/Jury');
const GroupedScores = require('../models/GroupedScores');
const Results = require('../models/Results');
const PublicResults = require('../models/PublicResult');
const Points = require('../models/Points');
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const checkAuth = require('../controllers/authMiddleware');


exports.adminDashboard = async (req, res) => {
    try {
        // Fetch all juries from the database
        const juries = await Jury.find();  // Fetch all juries

        // Fetch the results from the database
        const results = await Results.findOne({}, 'topPerformers groupPoints topPerformersByGroup').lean();

        // Check if results were found
        if (!results) {
            console.log("No results found.");
            return res.render('admin/dashboard', {
                juries,
                topPerformers: {},
                groupPoints: {},
                topPerformersByGroup: []
            });
        }

        // If results exist, pass them directly to the view without using map()
        const { topPerformers, groupPoints, topPerformersByGroup } = results;

        // Render the admin dashboard with juries and results data
        res.render('admin/dashboard', {
            juries,
            topPerformers: topPerformers || {},
            groupPoints: groupPoints || {},
            topPerformersByGroup: topPerformersByGroup || []
        });

    } catch (error) {
        console.error('Error fetching juries or results:', error);
        res.status(500).send('Error fetching data');
    }
};



exports.renderAddItemsPage = (req, res) => {
    res.render('admin/add-items', { isAuthenticated: req.session.isAuthenticated });
};
exports.renderContestants = (req, res) => {
    res.render('admin/contestants');
};



exports.uploadContestant = async (req, res) => {
    try {
        // Check if an Excel file was uploaded
        if (req.file) {
            const filePath = path.join(__dirname, '../', req.file.path);
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const contestants = xlsx.utils.sheet_to_json(worksheet, { header: ["contestantNumber", "name", "groupName"] });

            // Loop through parsed data and save each contestant
            for (const data of contestants) {
                const { contestantNumber, name, groupName } = data;
                const newContestant = new Contestant({ contestantNumber, name, groupName });
                await newContestant.save();
            }

            console.log('Contestants uploaded from Excel file successfully');
            res.redirect('/admin/contestants');
        } else {
            // Manual form entry
            const { contestantNumber, name, groupName } = req.body;
            const newContestant = new Contestant({ contestantNumber, name, groupName });
            await newContestant.save();

            console.log('Uploaded details successfully');
            res.redirect('/admin/contestants');
        }
    } catch (error) {
        console.error('Error uploading contestant details:', error.message);
        res.status(500).send(`Error uploading contestant details: ${error.message}`);
    }
};


// Fetch all contestants for admin view

exports.getContestants = async (req, res) => {
    try {
        const contestantsFromDb = await Contestant.find();
        // Convert each contestant document to a plain object
        const contestants = contestantsFromDb.map(contestant => contestant.toObject());

        res.render('admin/contestants', { isAuthenticated: req.session.isAuthenticated, contestants: contestants });
    } catch (error) {
        res.status(500).send("Error fetching contestants.");
    }
};

exports.deleteContestant = async (req, res) => {
    const contestantId = req.params.id;
    try {
        // console.log('called');
        // const contestantId = req.params.id;

        // Delete the contestant by ID
        await Contestant.findByIdAndDelete(contestantId);

        console.log(`Contestant with ID ${contestantId} deleted successfully`);
        res.redirect('/admin/contestants');
    } catch (error) {
        console.error('Error deleting contestant:', error.message);
        res.status(500).send(`Error deleting contestant: ${error.message}`);
    }
}



// Save the new item to the database
exports.createItem = async (req, res) => {
    try {
        const { name, category, type, stage } = req.body;

        // Check if an item with the same name and category (case-insensitive) already exists
        const existingItem = await Item.findOne({
            name: name.toLowerCase(),
            category: category.toLowerCase()
        });

        if (existingItem) {
            // Item with the same name and category already exists
            return res.json({ success: false, message: 'Item with this name already exists in the selected category.' });
        }

        // Create and save the new item
        const newItem = new Item({
            name: name.toLowerCase(),
            category: category.toLowerCase(),
            type,
            stage
        });

        await newItem.save();
        res.json({ success: true, message: 'Item added successfully!' });
    } catch (error) {
        console.error('Error Adding Item:', error);
        res.json({ success: false, message: 'An error occurred while adding the item.' });
    }
};

// Fetch and display items
exports.getItems = async (req, res) => {
    try {
        const itemsFromDb = await Item.find();
        const items = itemsFromDb.map(items => items.toObject());

        // Log the items to check their structure
        console.log('Items:', items);

        // Fetch juries from the database
        const juriesFromDb = await Jury.find();
        const juries = juriesFromDb.map(jury => jury.toObject());


        res.render('admin/items', { isAuthenticated: req.session.isAuthenticated, items, juries });
    } catch (error) {
        res.status(500).send('Error fetching items');
    }
};

// Update item state
exports.updateItemState = async (req, res) => {
    const { itemId, isChecked } = req.body;
    try {
        await Item.findByIdAndUpdate(itemId, { isChecked });
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};


// Fetch and display filtered items along with juries
exports.getFilteredItems = async (req, res) => {
    try {
        // Extract filter criteria from query parameters
        const { category, type, stage } = req.query;

        // Create a filter object
        let filter = {};

        // Add filter conditions based on query parameters if provided
        if (category) filter.category = category;
        if (type) filter.type = type;
        if (stage) filter.stage = stage;

        // Fetch items from the database based on the filter
        const itemsFromDb = await Item.find(filter);
        const items = itemsFromDb.map(item => item.toObject());

        // Log the items to check their structure
        console.log('Filtered Items:', items);

        // Fetch juries from the database
        const juriesFromDb = await Jury.find();
        const juries = juriesFromDb.map(jury => jury.toObject());

        // Render items with filtered results and juries
        res.render('admin/items', { items, juries });
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ success: false, message: 'Error fetching items' });
    }
};



// Fetch item details by ID
exports.getItemDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const item = await Item.findById(id).populate('participants').lean(); // Adjust as necessary for your data structure
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        res.json(item);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching item details' });
    }
};

//assign Jury To Item
exports.assignJuryToItem = async (req, res) => {
    const { itemId, juryId } = req.body;
    try {
        // Find the item and update with the selected jury
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found.' });
        }

        // Find the jury by ID
        const jury = await Jury.findById(juryId);
        if (!jury) {
            return res.status(404).json({ success: false, message: 'Jury not found.' });
        }

        // Check if the jury already has an assigned item
        if (jury.assignedItems.length > 0) {
            // If there's an existing item, remove it from the jury
            const existingItemId = jury.assignedItems[0]; // Get the existing item ID
            jury.assignedItems = []; // Clear the assigned items
            await jury.save(); // Save the updated jury

            // Optionally, if you want to clear the jury field in the item
            await Item.findByIdAndUpdate(existingItemId, { jury: null }); // Clear jury reference in the existing item
        }

        // Assign the new item to the jury
        item.jury = juryId; // Adjust as per your data structure
        await item.save();

        // Add the new item ID to the jury's assigned items
        jury.assignedItems.push(itemId);
        await jury.save();

        // Send success response
        return res.json({ success: true });
    } catch (error) {
        console.error('Error assigning jury:', error);
        // Ensure no previous response is sent before this
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: 'Error assigning jury.' });
        }
    }
};

          
// View item page with populated participants
exports.viewItemPage = async (req, res) => {
    const itemId = req.params.id;

    try {
        // Find the item by ID and populate participants with their necessary details
        const item = await Item.findById(itemId)
            .populate({
                path: 'participants',
                select: 'name contestantNumber',  // Select necessary fields 
            }).lean(); // Convert to plain JavaScript object for easy manipulation

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        // Fetch grouped scores for this item from GroupedScores collection
        const groupedScore = await GroupedScores.findOne({ itemId }).lean();

        // If scores exist, map them to the participants
        const participantScores = item.participants.map(participant => {
            const scoreEntry = groupedScore
                ? groupedScore.scores.find(s => s.contestantId.toString() === participant._id.toString())
                : null;

            return {
                id: participant._id,
                name: participant.name,
                contestantNumber: participant.contestantNumber,
                score: scoreEntry ? scoreEntry.score : null, // If score exists, add it
                badge: scoreEntry ? scoreEntry.badge : null  // If badge exists, add it
            };
        });

        // Debugging output to check data
        console.log('Participant Scores:', participantScores);

        // Render the view and pass participant data along with scores and badges
        res.render('admin/manageItem', { item, itemId: item._id.toString(), participantScores });
    } catch (error) {
        console.error('Error fetching item and participants:', error);
        res.status(500).json({ success: false, message: 'Error fetching item details' });
    }
};


exports.searchContestants = async (req, res) => {
    const query = req.query.q;
    console.log('Received search query:', query);  // Log the query

    try {
        if (!query) {
            return res.status(400).json({ error: 'No query provided' });
        }

        // Check if the query is numeric and treat it as a string search
        const isNumericQuery = !isNaN(query) && query.trim() !== '';

        let searchCriteria = {};

        if (isNumericQuery) {
            // If the query is numeric, search for the contestantNumber (as a string)
            searchCriteria.contestantNumber = query.toString(); // Ensure it searches as a string
        } else {
            // Otherwise, search for the name and groupName
            searchCriteria = {
                $or: [
                    { name: { $regex: query, $options: 'i' } },  // Case-insensitive match for name
                    { groupName: { $regex: query, $options: 'i' } },  // Case-insensitive match for groupName
                    { contestantNumber: { $regex: query, $options: 'i' } } // Case-insensitive match for contestantNumber
                ]
            };
        }

        console.log('Search Criteria:', searchCriteria);  // Log the search criteria

        // Perform the search
        const contestants = await Contestant.find(searchCriteria);

        if (contestants.length === 0) {
            return res.status(404).json({ message: 'No contestants found' });
        }

        console.log('Contestants found:', contestants);  // Log the results
        res.json(contestants);
    } catch (error) {
        console.error('Error searching contestants:', error);
        res.status(500).json({ error: 'Error searching contestants' });
    }
};





exports.addContestantToItem = async (req, res) => {
    const { itemId, contestantId } = req.body;
    try {
        console.log(`Received request to add contestant ${contestantId} to item ${itemId}`);

        // Validate ObjectId strings
        if (!mongoose.Types.ObjectId.isValid(itemId) || !mongoose.Types.ObjectId.isValid(contestantId)) {
            console.warn('Invalid ObjectId received');
            return res.status(400).send('Invalid item or contestant ID');
        }

        // Fetch item and contestant
        const item = await Item.findById(itemId);
        const contestant = await Contestant.findById(contestantId);

        if (!item || !contestant) {
            console.warn(`Item or contestant not found: itemId=${itemId}, contestantId=${contestantId}`);
            return res.status(404).json({ success: false, message: 'Item or contestant not found' });
        }

        if (item.participants.includes(contestantId)) {
            console.info(`Contestant ${contestantId} already added to item ${itemId}`);
            return res.status(400).json({ success: false, message: 'Contestant already added' });
        }

        // Add contestant and save the item
        console.log(`Adding contestant ${contestantId} to item ${itemId}`);
        item.participants.push(contestantId);
        await item.save();

        console.log(`Successfully added contestant ${contestantId} to item ${itemId}`);
        return res.json({ success: true, message: 'Contestant added successfully' });
    } catch (error) {
        console.error(`Error adding contestant to item: itemId=${itemId}, contestantId=${contestantId}`, error);
        return res.status(500).json({ success: false, message: 'Error adding contestant to item' });
    }
};





exports.deleteContestantFromItem = async (req, res) => {
    const { itemId, contestantId } = req.params;

    try {
        // Fetch the item from the database
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        // Check if contestant exists in the participants array
        const index = item.participants.indexOf(contestantId);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Contestant not found in this item' });
        }

        // Remove the contestant from participants array of the item
        item.participants.splice(index, 1);
        await item.save();

        // Now, we need to delete the contestant from other collections
        // Assuming contestantId is a reference to the contestant document, 
        // we will use `findOneAndDelete` or `update` in each of these collections.

        // Remove contestant from Results
        await Results.deleteMany({ contestantId });

        // Remove contestant from PublicResults
        await PublicResults.deleteMany({ contestantId });

        // Remove contestant from Points
        await Points.deleteMany({ contestantId });

        // Remove contestant from GroupedScores
        await GroupedScores.deleteMany({ contestantId });

        res.json({ success: true, message: 'Contestant removed successfully from item and other collections' });
    } catch (error) {
        console.error('Error deleting contestant from item:', error);
        res.status(500).json({ success: false, message: 'Error deleting contestant from item' });
    }
};


exports.renderJuryCreation = (req, res) => {
    res.render('admin/create-jury', { isAuthenticated: req.session.isAuthenticated });
};


// Create Jury

exports.createJury = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if the username already exists
        const existingJury = await Jury.findOne({ username });
        if (existingJury) {
            return res.status(400).send('Username already taken');
        }

        // Create the new jury
        const newJury = new Jury({ username, password });
        await newJury.save();

        const juries = await Jury.find();

        // Convert each Jury document to a plain object
        const juriesPlain = juries.map(jury => jury.toObject());
        res.render('admin/view-juries', { juries: juriesPlain });

    } catch (error) {
        console.error('Error creating jury:', error);
        res.status(500).send('Error creating jury');
    }
};

exports.viewAllJuries = async (req, res) => {
    try {
        const juries = await Jury.find();

        // Convert each Jury document to a plain object
        const juriesPlain = juries.map(jury => jury.toObject());
        res.render('admin/view-juries', { isAuthenticated: req.session.isAuthenticated, juries: juriesPlain });
    } catch (error) {
        console.error('Error fetching juries:', error);
        res.status(500).send('Error fetching juries');
    }
};


exports.deleteJury = async (req, res) => {
    try {
        const juryId = req.params.id;

        // Delete the jury from the database by ID
        await Jury.findByIdAndDelete(juryId);

        // After deletion, fetch the updated list of juries
        const juries = await Jury.find();
        const juriesPlain = juries.map(jury => jury.toObject());

        // Render the view with updated list of juries
        res.render('admin/view-juries', { juries: juriesPlain });
    } catch (error) {
        console.error('Error deleting jury:', error);
        res.status(500).send('Error deleting jury');
    }
};


exports.deleteItem = async (req, res) => {
    const itemId = req.params.id;

    try {
        // Delete the item
        const item = await Item.findByIdAndDelete(itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        // Delete the item from other collections by item ID directly
        await Promise.all([
            PublicResults.deleteOne({ itemId }),
            Points.deleteOne({ itemId }),
            GroupedScores.deleteOne({ itemId })
        ]);

        res.json({ success: true, message: 'Item and related data deleted successfully' });
    } catch (error) {
        console.error('Error deleting item and related data:', error);
        res.status(500).json({ success: false, message: 'Error deleting item and related data' });
    }
};



exports.viewItemsParticipants = async (req, res) => {
    try {
        // Fetch all items and their participants
        const items = await Item.find().populate('participants').lean().lean(); // Ensure 'participants' is properly defined in your schema

        if (!items || items.length === 0) {
            return res.render('viewItemsParticipants', { items: [] });
        }

        // Render the data on a new page
        res.render('viewItemsParticipants', { items });
    } catch (error) {
        console.error('Error fetching items and participants:', error.message);
        res.status(500).send('Error fetching items and participants.');
    }
};