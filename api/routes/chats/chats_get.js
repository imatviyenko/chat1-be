const constants = require('../../../constants');
const services = require('../../services');
const {createError} = require('../../../errors');
const {authorize} = require('../../../access');

module.exports = function(router) {

    router.get(`/chats`, authorize, async function(req, res, next) {  // get contacts for user specified by the auth token
        console.log(`\nHandling GET request for path /chats, timestamp: ${new Date().toString()}`);
        console.log(`User from token: ${JSON.stringify(req.user)}`);

        let chats;
        try {
            chats = await services.database.chats.getByUserEmail(req.user.email);
        } catch (e) {
            const message = `chats.get -> Error getting chats from database`;
            console.error(message);
            console.error(e);
            return next(createError(message, constants.ERROR_DATABASE_FAILURE, 500));
        };

        const result = {
            status: constants.ERROR_SUCCESS,
            chats
        };
        res.json(result);
    });

}
