const express = require('express');
const createHttpError = require('http-errors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();
const session = require('express-session');
const connectFlash = require('connect-flash');
const passport = require('passport');
const connectMongo = require('connect-mongo');
const connectEnsureLogin = require('connect-ensure-login')
const { roles } = require('./utils/constants');

// Initialize the app
const app = express();

// Middleware
app.use(morgan('dev'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//const MongoStore = connectMongo(session);

// Init Session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      // secure: true,
      httpOnly: true,
    },
   // store: new MongoStore({ mongooseConnection: mongoose.connection}),
  })
);

// for passport JS Authentication
app.use(passport.initialize());
app.use(passport.session());
require('./utils/passport.auth');

app.use((req, res, next) => {
    res.locals.user = req.user
    next()
})


// Flash messages middleware
app.use(connectFlash());
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

// Routes
app.use('/', require('./routes/index.route'));
app.use('/auth', require('./routes/auth.route'));
app.use('/user', connectEnsureLogin.ensureLoggedIn({redirectTo: '/auth/login'}),
require('./routes/user.route')
);
app.use('/admin',
connectEnsureLogin.ensureLoggedIn({redirectTo: '/auth/login'}), 
ensureAdmin,
require('./routes/admin.route'));


// Handle 404 errors
app.use((req, res, next) => {
  console.log(`404 error triggered for: ${req.url}`);
  next(createHttpError(404, 'Page Not Found'));
});

// Error-handling middleware
app.use((error, req, res, next) => {
  console.error(`Error: ${error.message}`);
  error.status = error.status || 500;
  res.status(error.status);
  res.render('error_40x', { error });
});

// Connect to MongoDB and start the server
const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME,
    // useNewUrlParser: true,   
    // useUnifiedTopology: true 
  })
  .then(() => {
    console.log('💾 Connected to MongoDB...');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error(`MongoDB connection error: ${err.message}`));

//   function ensureAuthenticated(req, res, next){
//     if (req.isAuthenticated()){
//         next()
//     } else{
//         res.redirect('/auth/login')
//     }
//   }
function ensureAdmin(req, res, next){
    if(req.user.role === roles.admin){
        next()
    } else{
        req.flash('warning', 'you are not Authorized to see this route');
        res.redirect('/');
    }
}
function ensureModerartor(req, res, next){
    if(req.user.role === roles.moderator){
        next()
    } else{
        req.flash('warning', 'you are not Authorized to see this route');
        res.redirect('/');
    }   
}