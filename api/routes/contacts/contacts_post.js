const Joi = require('joi');

const constants = require('../../../constants');
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
        console.log(`\nHandling POST request for path /contacts, timestamp: ${new Date().toString()}`);
        console.log(`User from token: ${JSON.stringify(req.user)}`);
        console.log(`contacts.post -> req.body:`);
        console.log(req.body);

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
        try {
            let contactDbUser = await services.database.users.getByEmailStatus(contactEmail);
            console.log(`contacts.post -> contactDbUser1: ${JSON.stringify(contactDbUser)}`);

            if (!contactDbUser) {
                // create new user record for the contact with USER_STATUS_REGISTRATION_PENDING status and only email field populated
                const contactUser = {
                    email: contactEmail,
                    status: constants.USER_STATUS_REGISTRATION_PENDING
                };
                contactDbUser =  await services.database.users.create(contactUser);
                console.log(`contacts.post -> contactDbUser2: ${JSON.stringify(contactDbUser)}`);

                // send registration request to the contact's email
                try {
                    await services.email.sendRegistrationRequest(req.user.email, req.user.displayName, contactEmail);
                } catch (e) {
                    const message = `contacts.post -> Error sending registration request to contact email ${contactEmail}, user record created and may need to be deleted`;
                    return next(createError(message, constants.ERROR_REGISTRATION_EMAIL_SENDING_FAILURE, 500, e));
                }
            }
            
            console.log(`contacts.post -> contactDbUser3: ${JSON.stringify(contactDbUser)}`);
            dbContact = await services.database.contacts.add(req.user.email, contactDbUser);
        } catch (e) {
            const message = `contacts.post -> Error adding contact`;
            return next(createError(message, constants.ERROR_DATABASE_FAILURE, 500, e));
        };

        result = {
            status: constants.ERROR_SUCCESS,
            contact: dbContact
        };
        res.json(result);
    });

}
