const logger = require('../../../logger');

const Joi = require('joi');

const constants = require('../../../constants');
const services = require('../../services');
const {createError, createCustomError} = require('../../../errors');


const validateBody = body => {
    if (!body || typeof body !== 'object') return false;

    const schema = Joi.object().keys({ 
        code: Joi.string().required()
      }); 

    return Joi.validate(body, schema);
};


const createInvalidCodeError = () => createCustomError(constants.ERROR_REGISTRATION_INVALID_CODE);


module.exports = function(router) {

    router.post(`/confirm`, async function(req, res, next) {  
        logger.log(`Handling POST request for path /confirm, timestamp: ${new Date().toString()}`);
        logger.log(`confirm.post -> req.body: ${JSON.stringify(req.body)}`);

        let result;

        const validationResult = validateBody(req.body);
        if (validationResult.error) {
            const message = 'confirm.post -> Error validating request body';
            logger.log(message);
            return next(createError(message, constants.ERROR_INVALID_PARAMETERS, 400, validationResult.error));
        }


        let emailFromCode;
        try {
            const decodedCode = req.body.code && services.crypto.decodeString(req.body.code);
            logger.log(`confirm.post -> decodedCode: ${JSON.stringify(decodedCode)}`);
            emailFromCode = JSON.parse(decodedCode).email;
            // decoded email address must not be null
            if (!emailFromCode) throw createInvalidCodeError();
        } catch (e) {
            const message = `confirm.post -> Error decoding code ${req.body.code}}`;
            logger.error(message);
            logger.error(e);
            const status = e.name == constants.ERROR_REGISTRATION_INVALID_CODE ? constants.ERROR_REGISTRATION_INVALID_CODE : constants.ERROR_GENERIC_SERVER_FAILURE;
            return next(createError(message, status, 403));
        };

        let dbUser;
        try {

            // find the user with USER_STATUS_CONFIRMATION_PENDING status and complete the registration
            logger.log(`confirm.post -> emailFromCode: ${emailFromCode}`);
            dbUser = await services.database.users.getByEmailStatus(emailFromCode, constants.USER_STATUS_CONFIRMATION_PENDING);
            logger.log(`confirm.post -> dbUser: ${JSON.stringify(dbUser)}`);

            if (dbUser) {
                const user = {
                    status: constants.USER_STATUS_ACTIVE
                };
                await services.database.users.upsertById(dbUser._id, user); // set existing user status to USER_STATUS_ACTIVE
            } else {
                const message = `confirm.post -> No matching user waiting for email confirmation found in the database}`;
                return next(createError(message, constants.ERROR_USER_NOT_FOUND, 404));
            }
        } catch (e) {
            const message = `confirm.post -> Error updating user in the database`;
            logger.error(message);
            logger.error(e);
            return next(createError(message, constants.ERROR_DATABASE_FAILURE, 500, e));
        };

        // if we successfully confirmed email the login the user
        result = {
            status: constants.ERROR_SUCCESS,
            token: services.crypto.getAuthToken(dbUser)
        };
        res.json(result);
    });

}
