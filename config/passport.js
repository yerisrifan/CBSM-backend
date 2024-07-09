const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user.model");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/user/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists in database
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // If user does not exist, create a new user in database
          user = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            // Add any other fields you want to populate from Google profile
          });
          await user.save();
        }

        // Return user object
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Serialize user into session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
