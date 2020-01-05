const constants = require('../../../../constants');
const User = require('../models/User');
const UpdateUserOnlineStatus = require('../models/UpdateUserOnlineStatus');

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

async function getOnlineUsersIdsByContactId(contactUserId) {
    const queryLiteral = {
        isOnline: true,
        "contacts": contactUserId
    };
    console.log(`getOnlineUsersIdsByContactId -> queryLiteral: ${JSON.stringify(queryLiteral)}`);

    const query = User.find(queryLiteral, '_id'); // get only _id property of all matching users
    const dbResult = await query.lean().exec();
    console.log(`getOnlineUsersIdsByContactId -> dbResult: ${JSON.stringify(dbResult)}`);
    return dbResult.map( d => d._id );
}

async function setUserOnlineStatus(userId, isOnline) {
    const queryLiteral = {
        _id: userId
    };    
    const query = User.updateOne(
        queryLiteral,
        {isOnline},
        {upsert: true}
    );
    await query.exec();

    const affectedUsers  = await getOnlineUsersIdsByContactId(userId);
    
    console.log(`services.database.users.setUserOnlineStatus -> userId: ${JSON.stringify(userId)}`);
    console.log(`services.database.users.setUserOnlineStatus -> affectedUsers: ${JSON.stringify(affectedUsers)}`);
    const docUpdateUserOnlineStatus = new UpdateUserOnlineStatus({
        userId,
        isOnline,
        affectedUsers
    });
    return docUpdateUserOnlineStatus.save();
}

async function isUserOnline(email) {
    const queryLiteral = {
        email
    };    
    const query = User.findOne(
        queryLiteral,
        'isOnline'
    );
    
    const dbResult = query.lean().exec();
    return dbResult && !!dbResult.isOnline;
}

module.exports = {
    create,
    upsertByEmailStatus,
    upsertById,
    getByEmailStatus,
    isUserOnline,
    setUserOnlineStatus,
    getOnlineUsersIdsByContactId
};