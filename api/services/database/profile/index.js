const constants = require('../../../../constants');
const User = require('../models/User');
const UpdateUserProfileProperties = require('../models/UpdateUserProfileProperties');
const {getOnlineUsersIdsByContactId} = require('../users');

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

async function update(profile) {
    const queryLiteral = {
        email: profile.email
    };


    const query = User.findOneAndUpdate(
        queryLiteral,
        {$set: profile},
        {upsert: false, new: true}
    );
    const dbUser = await query.lean().exec();

    // add record to the capped collection UpdateUserProfileProperties monitored by back-end server instances via the MongoDB Change Stream feature 
    // this will trigger watcher components of the back-end server instances to notify the connected WebSocket clients of the change in user profile properties
    const affectedUsers  = await getOnlineUsersIdsByContactId(dbUser._id);
    console.log(`services.database.users.upsertByEmailStatus -> affectedUsers: ${JSON.stringify(affectedUsers)}`);
    const docUpdateUserProfileProperties = new UpdateUserProfileProperties({
        userId: dbUser._id,
        affectedUsers
    });
    await docUpdateUserProfileProperties.save();

    return mapDbUserToProfile(dbUser);
}


module.exports = {
    getByUserEmail,
    update
};