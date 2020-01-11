const constants = require('../../../constants');
const services = require('../../services');
const {createError, createCustomError} = require('../../../errors');


const createInvalidCodeError = () => createCustomError(constants.ERROR_REGISTRATION_INVALID_CODE);


const validateBody = body => {
    if (!body || typeof body !== 'object') return false;

    const schema = Joi.object().keys({ 
        guid: Joi.string().guid().required(),
        displayName: Joi.string().required(),
        type: Joi.string().valid(constants.CHAT_TYPE_PRIVATE,constants.CHAT_TYPE_GROUP).required,
        lastMessageTimestamp: Joi.date().required(),
        users: Joi.array().when('type', {is: constants.CHAT_TYPE_PRIVATE, then: Joi.array().length(2)} )
      }); 

    return Joi.validate(body, schema);
};


module.exports = function(router) {
    router.put(`/chats/:guid`, function(req, res, next) {  
        console.log(`\nHandling PUT request for path /chats/guid, timestamp: ${new Date().toString()}`);

        const chatGuid = req.params['guid'];
        console.log(`chats.put -> chatGuid: ${chatGuid}`);

        console.log(`chats.put -> req.body:`);
        console.log(req.body);

        const validationResult = validateBody(req.body);
        if (validationResult.error) {
            const message = 'confirm.post -> Error validating request body';
            console.log(message);
            return next(createError(message, constants.ERROR_INVALID_PARAMETERS, 400, validationResult.error));
        }


        const chat = req.body;
        let updatedChat;
        try {
            updatedChat = await services.database.chats.updateByGuid(chatGuid, chat);
        } catch (e) {
            const message = `chats.put -> Error updating chat with guid ${chatGuid} in the database`;
            return next(createError(message, constants.ERROR_DATABASE_FAILURE, 500));
        };

        const result = {
            status: constants.ERROR_SUCCESS,
            chat: updatedChat
        };
        res.json(result);
    });
}
