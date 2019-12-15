const constants = require('../../constants');
const {getPasswordHash} = require('../../helpers/crypto');
const User = require('../../models/User');

module.exports = function(router, path) {

    router.post(`/${path}`, async function(req, res) {  
        console.log(`\nHandling POST request for path ${path}, timestamp: ${new Date().toString()}`);

        const user = req.body;
        console.log(`registration.post -> req.body:`);
        console.log(req.body);

        let result;
        try {
            const user = {
                ...req.body,
                email: req.body.email && req.body.email.toLowerCase(),
                status: constants.USER_STATUS_CONFIRMATION_PENDING
            };
            const passwordHash = await getPasswordHash(user.password);
            console.log(`registration.post -> passwordHash: ${passwordHash}`);
            user.passwordHash = passwordHash;
            
            const docUser = new User(user);
            await docUser.save();

            result = {
                status: constants.ERROR_SUCCESS
            };
        } catch(error) {
            result = {
                status: constants.ERROR_REGISTRATION_DATABASE_FAILURE
            };
        };
        res.json(result);
    });


    router.get(`/${path}/:code`, function(req, res) {  
        console.log(`\nHandling GET request for path ${path}/code, timestamp: ${new Date().toString()}`);

        const code = req.params['code'];
        console.log(`registration.get -> code: ${code}`);

        const result = {
            status: constants.ERROR_REGISTRATION_DATABASE_FAILURE
        };
        res.json(result);
    });

}
