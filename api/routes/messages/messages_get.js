const logger = require('../../../logger');

const constants = require('../../../constants');
const services = require('../../services');
const {createError} = require('../../../errors');
const {authorize} = require('../../../access');

module.exports = function(router) {

   router.get(`/chats/:guid/messages`, authorize, async function(req, res, next) {  // get contacts for user specified by the auth token
    logger.log(`Handling GET request for path /messages, timestamp: ${new Date().toString()}`);
    logger.log(`messages.get -> user from token: ${JSON.stringify(req.user)}`);

    const chatGuid = req.params['guid'];
    logger.log(`messages.get -> chatGuid: ${chatGuid}`);

    let messages;
    try {
        const sequenceNumberAfter = req.query['after'];
        const sequenceNumberBefore = req.query['before'];
        logger.log(`messages.get -> sequenceNumberAfter: ${sequenceNumberAfter}`);
        logger.log(`messages.get -> sequenceNumberBefore: ${sequenceNumberBefore}`);
        messages = await services.database.messages.getMessages(chatGuid, req.user.email, sequenceNumberAfter, sequenceNumberBefore);
    } catch (e) {
        const message = `messages.get -> Error getting messages from database`;
        logger.error(message);
        logger.error(e);
        return next(createError(message, constants.ERROR_DATABASE_FAILURE, 500));
    };

    const result = {
        status: constants.ERROR_SUCCESS,
        messages
    };
    res.json(result);
});    
}
