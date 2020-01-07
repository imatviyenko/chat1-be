const Joi = require('joi');

const constants = require('../../../constants');
const services = require('../../services');
const {createError} = require('../../../errors');


const validateBody = body => {
    if (!body || typeof body !== 'object') return false;

    const schema = Joi.object().keys({ 
        email: Joi.string().email().required(),
        password: Joi.string().min(constants.MIN_PASSWORD_LENGTH).max(constants.MIN_PASSWORD_LENGTH).required()
      }); 

    return Joi.validate(body, schema);
};


module.exports = function(router) {

    router.post(`/auth`, async function(req, res, next) {  
        console.log(`\nHandling POST request for path /auth, timestamp: ${new Date().toString()}`);
        console.log(`auth.post -> req.body:`);
        console.log(req.body);

        let result;

        const validationResult = validateBody(req.body);
        if (validationResult.error) {
            const message = 'auth.post -> Error validating request body';
            return next(createError(message, constants.ERROR_AUTH_INVALID_CREDENTIALS, 401)); // return 401 - Unauthorized HTTP status code
        }

        let dbUser;
        try {
            // find the user with matching email and USER_STATUS_ACTIVE status
            dbUser = await services.database.users.getByEmailStatus(req.body.email, constants.USER_STATUS_ACTIVE);
            console.log(`auth.post -> dbUser: ${JSON.stringify(dbUser)}`);
        } catch (e) {
            const message = `auth.post -> Error finding user in the database`;
            return next(createError(message, constants.ERROR_GENERIC_SERVER_FAILURE, 500, e));
        };

        if (dbUser) {
            // check if this user is already online and return error if he is - we only allow one active session per user
            if (dbUser.isOnline) {
                const message = `auth.post -> User is already online}`;
                return next(createError(message, constants.ERROR_AUTH_USER_ALREADY_ONLINE, 401));
            }

            const isPasswordValid = await services.crypto.validatePassword(req.body.password, dbUser.passwordHash);
            if (!isPasswordValid) {
                const message = `auth.post -> Incorrect password}`;
                return next(createError(message, constants.ERROR_AUTH_INVALID_CREDENTIALS, 401));
            }
        } else {
            const message = `auth.post -> No matching user found in the database}`;
            return next(createError(message, constants.ERROR_AUTH_INVALID_CREDENTIALS, 401));
        }

        // if we got here the credentials are valid an we can generate and return the auth token to the client
        result = {
            status: constants.ERROR_SUCCESS,
            token: services.crypto.getAuthToken(dbUser)
        };
        res.json(result);
    });

}
