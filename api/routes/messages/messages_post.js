const Joi = require('joi');
const uuidv4 = require('uuid/v4');

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
    router.post(`/chat/:guid/messages`, authorize, async function(req, res, next) {  
        console.log(`\nHandling POST request for path /messages, timestamp: ${new Date().toString()}`);
        console.log(`messages.post -> user from token: ${JSON.stringify(req.user)}`);
        const chatGuid = req.params['guid'];
        console.log(`messages.post -> chatGuid: ${chatGuid}`);
        console.log(`messages.post -> body: ${JSON.stringify(req.body)}`);

        const validationResult = validateBody(req.body);
        if (validationResult.error) {
            const message = 'messages.post -> Error validating request body';
            console.log(message);
            return next(createError(message, constants.ERROR_INVALID_PARAMETERS, 400, validationResult.error));
        }

        try {
            const message = {
                text: req.body.messageText,
                chatGuid: req.body.chatGuid,
                authorEmail: req.user.email
            };
            await services.database.messages.create(message);
        } catch (e) {
            const message = `messages.post -> Error creating new message in the database`;
            console.error(message);
            console.error(e);
            return next(createError(message, constants.ERROR_DATABASE_FAILURE, 500));
        };

        const result = {
            status: constants.ERROR_SUCCESS
        };
        res.json(result);
    });
}
