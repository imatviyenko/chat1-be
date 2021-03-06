const logger = require('../../../../logger');

const constants = require('../../../../constants');
const User = require('../models/User');

const mapDbUserToContact = dbUser => ({
    email: dbUser.email,
    displayName: dbUser.displayName,
    status: dbUser.status,
    isOnline: dbUser.isOnline
});


async function getByUserEmail(userEmail) {
    const query = User.findOne({
        email: userEmail.toLowerCase()
    });

    const dbUserWithContacts = await query
        .populate('contacts')
        .lean()
        .exec();

    if (Array.isArray(dbUserWithContacts.contacts)) return dbUserWithContacts.contacts.map(mapDbUserToContact);
    return [];
}

async function add(userEmail, contactDbUser) {
    logger.log(`services.contacts.add invoked`);
    logger.log(`services.contacts.add -> userEmail: ${userEmail}`);
    logger.log(`services.contacts.add -> contactDbUser: ${JSON.stringify(contactDbUser)}`);

    const queryLiteral = {
        email: userEmail.toLowerCase()
    };
    const update = { $push: { contacts: contactDbUser._id } };
    await User.findOneAndUpdate(queryLiteral, update).exec();
    return mapDbUserToContact(contactDbUser);
}


module.exports = {
    getByUserEmail,
    add
};