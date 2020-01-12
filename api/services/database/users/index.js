const constants = require('../../../../constants');
const User = require('../models/User');
const UpdateUserOnlineStatus = require('../models/UpdateUserOnlineStatus');
const UpdateUserProfileProperties = require('../models/UpdateUserProfileProperties');

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

    const dbUser = await _upsert(queryLiteral, user);
    console.log(`services.database.users.upsertByEmailStatus -> dbUser: ${JSON.stringify(dbUser)}`);

    // add record to the capped collection UpdateUserProfileProperties monitored by back-end server instances via the MongoDB Change Stream feature 
    // this will trigger watcher components of the back-end server instances to notify the connected WebSocket clients of the change in user profile properties
    const affectedUsers  = await getOnlineUsersIdsByContactId(dbUser._id);
    console.log(`services.database.users.upsertByEmailStatus -> affectedUsers: ${JSON.stringify(affectedUsers)}`);
    const docUpdateUserProfileProperties = new UpdateUserProfileProperties({
        userId: dbUser._id,
        affectedUsers
    });
    return docUpdateUserProfileProperties.save();
}

async function upsertById(filterId, user) {
    const queryLiteral = {
        _id: filterId
    };
    await _upsert(queryLiteral, user);
}


async function _upsert(queryLiteral, user) {
    const query = User.findOneAndUpdate(
        queryLiteral,
        {$set: user},
        {upsert: true, new: true}
    );
    return query.lean().exec();
    /*
    const query = User.updateOne(
        queryLiteral,
        {$set: user},
        {upsert: true}
    );
    await query.exec();
    */
}

async function getById(userId) {
    const query = User.findById(userId);
    return query.lean().exec();
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

    // add record to the capped collection UpdateUserOnlineStatus monitored by back-end server instances via the MongoDB Change Stream feature 
    // this will trigger watcher components of the back-end server instances to notify the connected WebSocket clients of the change in user online status
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

// Reset online status for all users when back-end server is restarted
async function resetAllUsersOnlineStatus() {
    const query = User.updateMany(
        {},
        {isOnline: false}
    );
    await query.exec();
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
    getById,
    getByEmailStatus,
    isUserOnline,
    setUserOnlineStatus,
    getOnlineUsersIdsByContactId,
    resetAllUsersOnlineStatus
};