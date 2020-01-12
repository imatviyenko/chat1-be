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
        email: Joi.string().email().required(),
        displayName: Joi.string().required()
    }); 

    return Joi.validate(body, schema);
};


module.exports = function(router) {
    router.put(`/profile`, authorize, async function(req, res, next) {  
        console.log(`\nHandling PUT request for path /profile, timestamp: ${new Date().toString()}`);
        console.log(`profile.put -> user from token: ${JSON.stringify(req.user)}`);
        console.log(`profile.put -> req.body: ${JSON.stringify(req.body)}`);

        const validationResult = validateBody(req.body);
        if (validationResult.error) {
            const message = 'profile.put -> Error validating request body';
            console.log(message);
            return next(createError(message, constants.ERROR_INVALID_PARAMETERS, 400, validationResult.error));
        }
        console.log(`profile.put -> req.body validated succcessfully`);


        const profile = req.body;
        let updatedProfile;
        try {
            updatedProfile = await services.database.profile.update(profile);
            console.log(`profile.put -> updatedProfile: ${JSON.stringify(updatedProfile)}`);
        } catch (e) {
            const message = `profile.put -> Error updating profile with email ${profile.email} in the database`;
            console.error(message);
            console.error(e);
            return next(createError(message, constants.ERROR_DATABASE_FAILURE, 500));
        };

        const result = {
            status: constants.ERROR_SUCCESS,
            profile: updatedProfile
        };
        res.json(result);
    });
}
