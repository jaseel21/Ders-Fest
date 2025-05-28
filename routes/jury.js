var express = require('express');
var router = express.Router();
var juryController = require('../controllers/juryControllers');


router.get('/', juryController.renderLoginPage);

// Route to handle jury login form submission
router.post('/login', juryController.loginJury);


// Route to render the jury's panel after successful login
router.get('/panel/:id', juryController.renderJuryPanel);

router.post('/save-scores', juryController.saveScores);

// router.get('/panel', juryController.renderJuryPanel);

module.exports = router;