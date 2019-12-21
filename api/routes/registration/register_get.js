const constants = require('../../../constants');
const services = require('../../services');
const {createError, createCustomError} = require('../../../errors');


const createInvalidCodeError = () => createCustomError(constants.ERROR_REGISTRATION_INVALID_CODE);

module.exports = function(router) {
    router.get(`/register/:code`, function(req, res, next) {  
        console.log(`\nHandling GET request for path /register/code, timestamp: ${new Date().toString()}`);

        const code = req.params['code'];
        console.log(`register.get -> code: ${code}`);

        let emailFromCode;
        try {
            emailFromCode = services.crypto.decodeString(code);
            if (!emailFromCode) throw createInvalidCodeError();
        } catch (e) {
            const message = `register.get -> Error decoding code ${code}}`;
            const status = e.name == constants.ERROR_REGISTRATION_INVALID_CODE ? constants.ERROR_REGISTRATION_INVALID_CODE : constants.ERROR_GENERIC_SERVER_FAILURE;
            return next(createError(message, status, 403));
        };

        const result = {
            status: constants.ERROR_SUCCESS,
            email: emailFromCode
        };
        res.json(result);
    });
}
