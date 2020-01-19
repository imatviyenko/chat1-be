const logger = require('../../../logger');

const Joi = require('joi');
const uuidv4 = require('uuid/v4');

const constants = require('../../../constants');
const config = require('../../../config');
const services = require('../../services');
const {createError} = require('../../../errors');
const {authorize} = require('../../../access');


const validateBody = body => {
    if (!body || typeof body !== 'object') return false;

    const schema = Joi.object().keys({ 
        contactEmail: Joi.string().email().required()
      }); 

    return Joi.validate(body, schema);
};


module.exports = function(router) {

    router.post(`/contacts`, authorize, async function(req, res, next) {  
        logger.log(`Handling POST request for path /contacts, timestamp: ${new Date().toString()}`);
        logger.log(`contacts.post -> user from token: ${JSON.stringify(req.user)}`);
        logger.log(`contacts.post -> req.body: ${JSON.stringify(req.body))}`);

        let result;

        const validationResult = validateBody(req.body);
        if (validationResult.error) {
            const message = 'contacts.post -> Error validating request body';
            return next(createError(message, constants.ERROR_INVALID_PARAMETERS, 400));
        }

        const contactEmail = req.body.contactEmail.toLowerCase();
        
        if (contactEmail === req.user.email.toLowerCase()) {
            const message = 'contacts.post -> Error - the email of the contact is equal to the email of the user';
            return next(createError(message, constants.ERROR_INVALID_PARAMETERS, 400));
        }

        let dbContact;
        let dbChat;
        try {
            let contactDbUser = await services.database.users.getByEmailStatus(contactEmail);
            logger.log(`contacts.post -> contactDbUser1: ${JSON.stringify(contactDbUser)}`);

            if (!contactDbUser) {
                // create new user record for the contact with USER_STATUS_REGISTRATION_PENDING status and only email field populated
                const contactUser = {
                    email: contactEmail,
                    status: constants.USER_STATUS_REGISTRATION_PENDING
                };
                contactDbUser =  await services.database.users.create(contactUser);
                logger.log(`contacts.post -> contactDbUser2: ${JSON.stringify(contactDbUser)}`);

                // send registration request to the contact's email
                try {
                    await services.email.sendRegistrationRequest(req.user.email, req.user.displayName, contactEmail);
                } catch (e) {
                    const message = `contacts.post -> Error sending registration request to contact email ${contactEmail}, user record created and may need to be deleted`;
                    logger.error(message);
                    logger.error(e);
                    return next(createError(message, constants.ERROR_REGISTRATION_EMAIL_SENDING_FAILURE, 500, e));
                }
            }
            
            // Add contact to the user record in the database
            logger.log(`contacts.post -> contactDbUser3: ${JSON.stringify(contactDbUser)}`);
            dbContact = await services.database.contacts.add(req.user.email, contactDbUser);

            // add the current user to list of contact of the contact (if User1 adds User2 as a contact, then User2 will have User1 in his contacts as well)
            await services.database.contacts.add(contactDbUser.email, req.user);

            // Create a new private chat between the user and the contact
            
            const chat = {
                guid: uuidv4().toLowerCase(),
                displayName: config.defaultPrivateChatDisplayName,
                type: constants.CHAT_TYPE_PRIVATE,
                usersEmails: [req.user.email, contactEmail]
            };
            dbChat = await services.database.chats.create(chat);
        } catch (e) {
            const message = `contacts.post -> Error adding contact`;
            logger.error(message);
            logger.error(e);
            return next(createError(message, constants.ERROR_DATABASE_FAILURE, 500, e));
        };

        result = {
            status: constants.ERROR_SUCCESS,
            contact: dbContact,
            chat: dbChat
        };
        res.json(result);
    });

}
