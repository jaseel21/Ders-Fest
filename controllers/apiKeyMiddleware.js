// middleware/apiKeyMiddleware.js
require('dotenv').config();

const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ message: 'Invalid or missing API key' });
  }

  next();
};

module.exports = verifyApiKey;
