const constants = require('../../../../constants');
const User = require('../models/User');

const mapDbUserToProfile = dbUser => ({
    email: dbUser.email,
    displayName: dbUser.displayName
});


async function getByUserEmail(userEmail) {
    const query = User.findOne({
        email: userEmail.toLowerCase()
    });

    const dbUser = await query
        .lean()
        .exec();

    return mapDbUserToProfile(dbUser);
}

module.exports = {
    getByUserEmail
};