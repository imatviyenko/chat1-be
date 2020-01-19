const logger = require('../../../logger');

const Joi = require('joi');

const constants = require('../../../constants');
const config = require('../../../config');
const services = require('../../services');
const {createError, createCustomError} = require('../../../errors');
const {authorize} = require('../../../access');


const createInvalidCodeError = () => createCustomError(constants.ERROR_REGISTRATION_INVALID_CODE);


const validateBody = body => {
    if (!body || typeof body !== 'object') return false;

    const schema = Joi.object().keys({ 
        guid: Joi.string().guid().required(),
        displayName: Joi.string().required(),
        type: Joi.string().valid(constants.CHAT_TYPE_PRIVATE,constants.CHAT_TYPE_GROUP).required(),
        lastMessageTimestamp: Joi.date(),
        users: Joi.array().when('type', {is: constants.CHAT_TYPE_PRIVATE, then: Joi.array().length(2)} )
      }); 

    return Joi.validate(body, schema, {allowUnknown: true}); // allow unknown props like createdAt, __v and etc.
};


module.exports = function(router) {
    router.put(`/chats/:guid`, authorize, async function(req, res, next) {  
        logger.log(`Handling PUT request for path /chats/guid, timestamp: ${new Date().toString()}`);

        const chatGuid = req.params['guid'];
        logger.log(`chats.put -> chatGuid: ${chatGuid}`);

        logger.log(`chats.put -> req.body:`);
        logger.log(req.body);

        const validationResult = validateBody(req.body);
        if (validationResult.error) {
            const message = 'chats.put -> Error validating request body';
            logger.log(message);
            return next(createError(message, constants.ERROR_INVALID_PARAMETERS, 400, validationResult.error));
        }
        logger.log(`chats.put -> req.body validated succcessfully`);


        const chat = req.body;
        let updatedChat;
        try {
            updatedChat = await services.database.chats.updateByGuid(chatGuid, chat);
            logger.log(`chats.put -> updatedChat: ${JSON.stringify(updatedChat)}`);
        } catch (e) {
            const message = `chats.put -> Error updating chat with guid ${chatGuid} in the database`;
            logger.error(message);
            logger.error(e);
            return next(createError(message, constants.ERROR_DATABASE_FAILURE, 500));
        };

        const result = {
            status: constants.ERROR_SUCCESS,
            chat: updatedChat
        };
        res.json(result);
    });
}
