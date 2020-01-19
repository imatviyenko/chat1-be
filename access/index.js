const logger = require('../logger');

const config = require('../config');
const services = require('../api/services');
const constants = require('../constants');
const {createError} = require('../errors');

const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;



const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.serverSecret,
    issuer: config.jwtIssuer,
    audience: config.jwtAudience
};

// https://developerhandbook.com/passport.js/protect-website-using-passportjs-jwt/
const strategy = new JwtStrategy(options, async (jwtPayload, done) => {
    if (!(jwtPayload && jwtPayload.sub)) return done(createError('Invalid token', constants.ERROR_JWT_INVALID_TOKEN, 401));

    try {
        const dbUser = await services.database.users.getByEmailStatus(jwtPayload.sub, constants.USER_STATUS_ACTIVE); // sub field of jwt token should contain user email
        if (!dbUser) return done(createError('User not found', constants.ERROR_USER_NOT_FOUND, 401));
        return done(null, dbUser);
    } catch (e) {
        return done(createError('Error processing token', constants.ERROR_GENERIC_SERVER_FAILURE, 401, e));
    }
});

passport.use(strategy);
const authorize = passport.authenticate('jwt', { session: false });


const accessControl = {
    authorize
}

module.exports = accessControl;