const constants = require('../../../constants');
const services = require('../../services');
const {createError} = require('../../../errors');
const {authorize} = require('../../../access');

module.exports = function(router) {

   router.get(`/chats/:guid/messages`, authorize, async function(req, res, next) {  // get contacts for user specified by the auth token
    console.log(`\nHandling GET request for path /messages, timestamp: ${new Date().toString()}`);
    console.log(`messages.get -> user from token: ${JSON.stringify(req.user)}`);

    const chatGuid = req.params['guid'];
    console.log(`messages.get -> chatGuid: ${chatGuid}`);

    let messages;
    try {
        const sequenceNumberAfter = req.query['after'];
        const sequenceNumberBefore = req.query['before'];
        console.log(`messages.get -> sequenceNumberAfter: ${sequenceNumberAfter}`);
        console.log(`messages.get -> sequenceNumberBefore: ${sequenceNumberBefore}`);
        messages = await services.database.messages.getMessages(chatGuid, req.user.email, sequenceNumberAfter, sequenceNumberBefore);
    } catch (e) {
        const message = `messages.get -> Error getting messages from database`;
        console.error(message);
        console.error(e);
        return next(createError(message, constants.ERROR_DATABASE_FAILURE, 500));
    };

    const result = {
        status: constants.ERROR_SUCCESS,
        messages
    };
    res.json(result);
});    
}
