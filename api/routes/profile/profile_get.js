const logger = require('../../../logger');

const constants = require('../../../constants');
const services = require('../../services');
const {createError} = require('../../../errors');
const {authorize} = require('../../../access');

module.exports = function(router) {
    router.get(`/profile`, authorize, async function(req, res, next) {  // get profile data for the user specified by the auth token
        logger.log(`Handling GET request for path /contacts, timestamp: ${new Date().toString()}`);
        logger.log(`User from token: ${JSON.stringify(req.user)}`);

        let profile;
        try {
            profile = await services.database.profile.getByUserEmail(req.user.email);
        } catch (e) {
            const message = `profile.get -> Error getting user profile from database`;
            logger.error(message);
            logger.error(e);
            return next(createError(message, constants.ERROR_DATABASE_FAILURE, 500));
        };

        const result = {
            status: constants.ERROR_SUCCESS,
            profile
        };
        res.json(result);
    });
}
