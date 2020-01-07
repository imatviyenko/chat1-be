const Joi = require('joi');

const constants = require('../../../constants');
const services = require('../../services');
const {createError, createCustomError} = require('../../../errors');


const validateBody = body => {
    if (!body || typeof body !== 'object') return false;

    const schema = Joi.object().keys({ 
        email: Joi.string().email().required(),
        displayName: Joi.string().alphanum().min(constants.MIN_USER_DISPLAY_NAME_LENGTH).max(constants.MAX_USER_DISPLAY_NAME_LENGTH).required(),
        password: Joi.string().min(constants.MIN_PASSWORD_LENGTH).max(constants.MIN_PASSWORD_LENGTH).required(),
        code: Joi.string().optional()
      }); 

    return Joi.validate(body, schema);
};


const createInvalidCodeError = () => createCustomError(constants.ERROR_REGISTRATION_INVALID_CODE);


module.exports = function(router) {

    router.post(`/register`, async function(req, res, next) {  
        console.log(`\nHandling POST request for path /register, timestamp: ${new Date().toString()}`);
        console.log(`register.post -> req.body:`);
        console.log(req.body);

        let result;

        const validationResult = validateBody(req.body);
        if (validationResult.error) {
            const message = 'register.post -> Error validating request body';
            console.log(message);
            return next(createError(message, constants.ERROR_INVALID_PARAMETERS, 400, validationResult.error));
        }

        let emailFromCode;
        let user;
        try {
            emailFromCode = req.body.code && services.crypto.decodeString(req.body.code);
            
            if (emailFromCode) {
                // decoded email address from the code must be equal to the posted email value in the request body
                if (!req.body.email || emailFromCode.toLowerCase() !== req.body.email.toLowerCase()) throw createInvalidCodeError();
            }
            
        } catch (e) {
            const message = `register.post -> Error decoding code ${req.body.code}: ${errorToString(e)}`;
            const status = e.name == constants.ERROR_REGISTRATION_INVALID_CODE ? constants.ERROR_REGISTRATION_INVALID_CODE : constants.ERROR_GENERIC_SERVER_FAILURE;
            return next(createError(message, status, 403));
        };

        try {
             user = {
                ...req.body,
                email: req.body.email.toLowerCase(),
             };
             const passwordHash = await services.crypto.getPasswordHash(user.password);
             user.passwordHash = passwordHash;
             console.log(`register.post -> passwordHash: ${passwordHash}`);

            // if we extracted email address from the encrypted code we can complete user registration, otherwise his email needs to be confirmed first
            if (emailFromCode) {
                user.status = constants.USER_STATUS_ACTIVE;
                await services.database.users.upsertByEmailStatus(user.email, constants.USER_STATUS_REGISTRATION_PENDING, user); // Update an existing user with status USER_STATUS_REGISTRATION_PENDING in the database
                result = {
                    status: constants.ERROR_SUCCESS,
                    token: services.crypto.getAuthToken(user)
                };
            } else {
                user.status = constants.USER_STATUS_CONFIRMATION_PENDING;
                await services.database.users.upsertByEmailStatus(user.email, constants.USER_STATUS_CONFIRMATION_PENDING, user); // Create a new user in the database or overwrite an existing user record in the USER_STATUS_CONFIRMATION_PENDING state
                result = {
                    status: constants.ERROR_SUCCESS
                };
            }
            
        } catch (e) {
            const message = `register.post -> Error saving user to the database`;
            return next(createError(message, constants.ERROR_DATABASE_FAILURE, 500, e));
        };

        // Send out email with a confirmation link only if the email has not been provided in the encrypted code
        if (!emailFromCode) {
            try {
                await services.email.sendConfirmEmailLink(user.email, user.displayName);
            } catch (e) {
                const message = `register.post -> Error sending confirmation link to user email ${user.email}`;
                return next(createError(message, constants.ERROR_REGISTRATION_EMAIL_SENDING_FAILURE, 500, e));
            }
        }


        res.json(result);
    });

}
