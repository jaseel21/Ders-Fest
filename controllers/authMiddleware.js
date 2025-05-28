// middleware/authMiddleware.js

module.exports = (req, res, next) => {
    if (req.session.isAuthenticated) {
        return next(); // Allow access to the next route
    }

    // If not authenticated, redirect to login page
    res.redirect('/admin/login');
};
