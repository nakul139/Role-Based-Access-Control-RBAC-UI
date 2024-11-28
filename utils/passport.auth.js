const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user.model');

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          return done(null, false, {
            message: 'Username/email not registered',
          });
        }

        const isMatch = await user.isValidPassword(password); // Ensure isValidPassword is defined in your User model
        return isMatch
          ? done(null, user)
          : done(null, false, { message: 'Incorrect password' });
      } catch (error) {
        done(error);
      }
    }
  )
);

// Serialize user (store only user ID in session)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user (retrieve user details from ID)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id); // Updated to use async/await
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});


