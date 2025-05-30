var createError = require('http-errors');
var express = require('express');
const socketIo = require('socket.io');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var exphbs = require('express-handlebars');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');
const Handlebars = require('handlebars');
require('dotenv').config();

var db = require('./config/db');

// Connecting to the database
db.connect((err) => {
  if (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  } else {
    console.log('Connected to MongoDB');
  }
});

var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var juryRouter = require('./routes/jury');

var app = express();

// View engine setup
app.engine('hbs', exphbs.engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'views', 'partials')
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Register Handlebars helpers
Handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});
Handlebars.registerHelper('keys', function (obj) {
  return Object.keys(obj);
});

// Secure session setup with MongoDB store
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true in production with HTTPS
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  }
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// API routes with API key middleware
const verifyApiKey = require('./controllers/apiKeyMiddleware');
app.use('/api', verifyApiKey, (req, res, next) => {
  app.get('/api/time', (req, res) => {
    const nowUtc = new Date();
    const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
    const gmtPlus530 = new Date(nowUtc.getTime() + istOffsetMs);
    res.json({
      datetime: gmtPlus530.toISOString(),
      day_of_week: gmtPlus530.getDay(),
      current_time: gmtPlus530.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      }),
    });
  });
  next();
});

// User-facing routes
app.use('/', userRouter);
app.use('/admin', adminRouter);
app.use('/jury', juryRouter);

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
