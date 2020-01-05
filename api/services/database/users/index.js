const constants = require('../../../../constants');
const User = require('../../../models/User');

async function create(user) {
    const docUser = new User({
        ...user,
        email: user.email.toLowerCase()
    });

    console.log(`services.database.users.create -> user: ${JSON.stringify(user)}`);
    return docUser.save();
}

async function upsertByEmailStatus(filterEmail, filterStatus, user) {
    const queryLiteral = {
        email: filterEmail
    };
    if (filterStatus) queryLiteral.status = filterStatus;

    await _upsert(queryLiteral, user);
}

async function upsertById(filterId, user) {
    const queryLiteral = {
        _id: filterId
    };
    await _upsert(queryLiteral, user);
}


async function _upsert(queryLiteral, user) {
    const query = User.updateOne(
        queryLiteral,
        {$set: user},
        {upsert: true}
    );
    await query.exec();
}


async function getByEmailStatus(filterEmail, filterStatus) {
    const queryLiteral = {
        email: filterEmail.toLowerCase()
    };
    if (filterStatus) queryLiteral.status = filterStatus;
    console.log(`getByEmailStatus -> queryLiteral: ${JSON.stringify(queryLiteral)}`);

    const query = User.findOne(queryLiteral);
    return query.lean().exec();
}

module.exports = {
    create,
    upsertByEmailStatus,
    upsertById,
    getByEmailStatus
};