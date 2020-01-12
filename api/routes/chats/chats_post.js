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

    // only GROUP chats can be created via this endpoint, PRIVATE chats are created automatically when users add contacts
    const schema = Joi.object().keys({ 
        //type: Joi.string().valid(constants.CHAT_TYPE_GROUP).required,
        "type": Joi.string().required()
      }); 

    return Joi.validate(body, schema);
};


module.exports = function(router) {
    router.post(`/chats`, authorize, async function(req, res, next) {  
        console.log(`\nHandling POST request for path /chats, timestamp: ${new Date().toString()}`);
        console.log(`chats.post -> user from token: ${JSON.stringify(req.user)}`);
        console.log(`chats.post -> body: ${JSON.stringify(req.body)}`);

        const validationResult = validateBody(req.body);
        if (validationResult.error) {
            const message = 'chats.post -> Error validating request body';
            console.log(message);
            return next(createError(message, constants.ERROR_INVALID_PARAMETERS, 400, validationResult.error));
        }


        let dbChat;
        try {
            const chat = {
                guid: uuidv4().toLowerCase(),
                displayName: config.defaultGroupChatDisplayName,
                type: constants.CHAT_TYPE_GROUP,
                usersEmails: [req.user.email]
            };
            dbChat = await services.database.chats.create(chat);
        } catch (e) {
            const message = `chats.post -> Error creating new group chat in the database`;
            console.error(message);
            console.error(e);
            return next(createError(message, constants.ERROR_DATABASE_FAILURE, 500));
        };

        const result = {
            status: constants.ERROR_SUCCESS,
            chat: dbChat
        };
        res.json(result);
    });
}
