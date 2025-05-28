var createError = require('http-errors');
var express = require('express');
const socketIo = require('socket.io');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var exphbs = require('express-handlebars');
const session = require('express-session');
const bcrypt = require('bcrypt');
const Handlebars = require('handlebars');
require('dotenv').config(); // To use environment variables

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

// view engine setup
app.engine('hbs', exphbs.engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'views', 'partials')
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Register an equality helper
Handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

// Register a keys helper
Handlebars.registerHelper('keys', function (obj) {
  return Object.keys(obj);
});

app.use(session({
  secret: 'AdSa@#000',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }  // Set to `true` if you're using HTTPS
}));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', userRouter);
app.use('/admin', adminRouter);
app.use('/jury', juryRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
