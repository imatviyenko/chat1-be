const logger = require('../../../logger');

const constants = require('../../../constants');
const services = require('../../services');
const {createError} = require('../../../errors');
const {authorize} = require('../../../access');

module.exports = function(router) {
    router.get(`/contacts`, authorize, async function(req, res, next) {  // get contacts for user specified by the auth token
        logger.log(`Handling GET request for path /contacts, timestamp: ${new Date().toString()}`);
        logger.log(`contacts.get -> user from token: ${JSON.stringify(req.user)}`);

        let contacts;
        try {
            contacts = await services.database.contacts.getByUserEmail(req.user.email);
        } catch (e) {
            const message = `contacts.get -> Error getting contacts from database`;
            logger.error(message);
            logger.error(e);
            return next(createError(message, constants.ERROR_DATABASE_FAILURE, 500));
        };

        const result = {
            status: constants.ERROR_SUCCESS,
            contacts
        };
        res.json(result);
    });
}
