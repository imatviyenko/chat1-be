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
        chatGuid: Joi.string().guid().required(),
        messageText: Joi.string().required()
    }); 

    return Joi.validate(body, schema);
};


module.exports = function(router) {
    router.post(`/chats/:guid/messages`, authorize, async function(req, res, next) {  
        logger.log(`Handling POST request for path /messages, timestamp: ${new Date().toString()}`);
        logger.log(`messages.post -> user from token: ${JSON.stringify(req.user)}`);
        const chatGuid = req.params['guid'];
        logger.log(`messages.post -> chatGuid: ${chatGuid}`);
        logger.log(`messages.post -> body: ${JSON.stringify(req.body)}`);

        const validationResult = validateBody(req.body);
        if (validationResult.error) {
            const message = 'messages.post -> Error validating request body';
            logger.log(message);
            return next(createError(message, constants.ERROR_INVALID_PARAMETERS, 400, validationResult.error));
        }

        try {
            const message = {
                text: req.body.messageText,
                chatGuid: req.body.chatGuid,
                authorEmail: req.user.email.toLowerCase()
            };
            await services.database.messages.create(message);
        } catch (e) {
            const message = `messages.post -> Error creating new message in the database`;
            logger.error(message);
            logger.error(e);
            return next(createError(message, constants.ERROR_DATABASE_FAILURE, 500));
        };

        const result = {
            status: constants.ERROR_SUCCESS
        };
        res.json(result);
    });
}
