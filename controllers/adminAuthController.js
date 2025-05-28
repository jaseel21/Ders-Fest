// controllers/adminAuthController.js
const adminController = require('../controllers/adminControllers');
const bcrypt = require('bcrypt');
const session = require('express-session');

// Mocked admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync('FestAdmin786', 10); // Hashing password for security

// Admin Login Handler
exports.login = (req, res) => {
  res.render('admin/login'); // Render login page (replace with your actual view)
};

// Admin Auth Check Handler
exports.authenticate = (req, res) => {
  const { username, password } = req.body;

  // Check if the username is correct
  if (username !== ADMIN_USERNAME) {
    return res.status(401).send('Invalid username or password');
  }

  // Check if the password matches the hashed password
  bcrypt.compare(password, ADMIN_PASSWORD_HASH, (err, result) => {
    if (err) {
      return res.status(500).send('Error during authentication');
    }

    if (!result) {
      return res.status(401).send('Invalid username or password');
    }

    // Store user session information
    req.session.isAuthenticated = true;
    req.session.username = username;

    // Redirect to admin dashboard
    // return res.render('admin/dashboard');
    // Call the adminDashboard function after authentication
    return res.redirect('/admin');
  });
};

// Admin Logout Handler
exports.logout = (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error during logout');
    }
    res.render('admin/login');
  });
};
