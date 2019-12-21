const constants = require('../../../../constants');
const User = require('../../../models/User');


async function getByUserEmail(userEmail) {
    const query = User.findOne({
        email: userEmail.toLowerCase()
    });

    const dbUserWithContacts = await query
        .populate('contacts')
        .lean()
        .exec();

    return dbUserWithContacts.contacts;
}

async function add(userEmail, contactDbUser) {
    const queryLiteral = {
        email: userEmail.toLowerCase()
    };
    const update = { $push: { contacts: contactDbUser._id } };

    return User.findOneAndUpdate(queryLiteral, update).exec();
}


module.exports = {
    getByUserEmail,
    add
};