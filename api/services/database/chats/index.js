const constants = require('../../../../constants');
const {createError} = require('../../../../errors');
const Chat = require('../models/Chat');
const User = require('../models/User');
const UpdateChatProperties = require('../models/UpdateChatProperties');


// get chats where the user specified by email is participating
async function getByUserEmail(userEmail) {
    const queryLiteral = {
        "users.email": userEmail
    };

    const query = Chat.find(queryLiteral);
    return query.lean().exec();
}

// get chat by guid
async function getByGuid(chatGuid) {
    const queryLiteral = {
        "guid": chatGuid
    };

    const query = Chat.find(queryLiteral);
    return query.lean().exec();
}


// convert chat.usersEmails to dbUsers with _id field
async function usersEmailsToDbUsers(usersEmails) {
    let dbUsers = [];
    if (Array.isArray(usersEmails)) {
        const dbUsersPromises = usersEmails.map( async userEmail => {
            console.log(`services.chats.create -> userEmail: ${userEmail}`);        
            const dbUser = await User.findOne({email: userEmail.toLowerCase()}).lean().exec();
            console.log(`services.chats.create -> dbUser: ${JSON.stringify(dbUser)}`);
            if (!dbUser) throw createError(`services.database.chats.create -> Could not find user by email ${userEmail}`);
            dbUsers.push(dbUser);
        });
        await Promise.all(dbUsersPromises);
    }
    return dbUsers;
}

// create new chat
async function create(chat) {
    const dbUsers = await usersEmailsToDbUsers(chat.usersEmails);
    const docChat = new Chat({
        guid: chat.guid,
        displayName: chat.displayName,
        type: chat.type,
        users: dbUsers
    });
    const dbChat = await docChat.save();

    console.log(`services.chats.create -> chat:`);
    console.log(JSON.stringify(chat));
    console.log(`services.chats.create -> dbChat:`);
    console.log(JSON.stringify(dbChat));


    // add record to the capped collection UpdateChatProperties monitored by back-end server instances via the MongoDB Change Stream feature 
    // this will trigger watcher components of the back-end server instances to notify the connected WebSocket clients of the change in chat properties
    const affectedUsers  = dbUsers.map( u => u._id );
    const docUpdateChatProperties = new UpdateChatProperties({
        chatGuid: chat.guid,
        affectedUsers
    });
    await docUpdateChatProperties.save();

    
    // fetch newly created Chat document from the database again an return it as a lean object
    const queryLiteral = {
        "guid": dbChat.guid
    };
    const query = Chat.findOne(queryLiteral);
    return query.lean().exec(); 
}



async function updateByGuid(chatGuid, chat) {
    const queryLiteral = {
        guid: chatGuid
    };

    const userEmails = chat.users.map( u => u.email);
    const dbUsers = await usersEmailsToDbUsers(userEmails);
    const _chat = {
        ...chat,
        users: dbUsers
    };

    const query = Chat.findOneAndUpdate(
        queryLiteral,
        {$set: _chat},
        {upsert: false, new: true}
    );
    const dbChat = await query.lean().exec();

    // add record to the capped collection UpdateChatProperties monitored by back-end server instances via the MongoDB Change Stream feature 
    // this will trigger watcher components of the back-end server instances to notify the connected WebSocket clients of the change in chat properties
    const affectedUsers  = dbUsers.map( u => u._id );
    const docUpdateChatProperties = new UpdateChatProperties({
        chatGuid: chat.guid,
        affectedUsers
    });
    await docUpdateChatProperties.save();

    return dbChat;
}


module.exports = {
    create,
    getByUserEmail,
    getByGuid,
    updateByGuid
};