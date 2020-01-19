const logger = require('../../../../logger');

const constants = require('../../../../constants');
const {createError} = require('../../../../errors');
const Chat = require('../models/Chat');
const User = require('../models/User');
const UpdateChatProperties = require('../models/UpdateChatProperties');
const {usersEmailsToDbUsers} = require('../users');


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

    const query = Chat.findOne(queryLiteral);
    return query.lean().exec();
}




// create new chat
async function create(chat) {
    logger.log(`services.chats.create invoked`);
    logger.log(`services.chats.create -> chat: ${JSON.stringify(chat)}`);

    const dbUsers = await usersEmailsToDbUsers(chat.usersEmails);
    const docChat = new Chat({
        guid: chat.guid,
        displayName: chat.displayName,
        type: chat.type,
        users: dbUsers
    });
    const dbChat = await docChat.save();

    logger.log(`services.chats.create -> dbUsers: ${JSON.stringify(dbUsers)}`);
    logger.log(`services.chats.create -> dbChat: ${JSON.stringify(dbChat)}`);
    

    // add record to the capped collection UpdateChatProperties monitored by back-end server instances via the MongoDB Change Stream feature 
    // this will trigger watcher components of the back-end server instances to notify the connected WebSocket clients of the change in chat properties
    const affectedUsers  = dbUsers.map( u => ({_id: u._id, isOnline: u.isOnline}) );
    logger.log(`services.chats.create -> affectedUsers: ${JSON.stringify(affectedUsers)}`);

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
    logger.log(`services.chats.updateByGuid invoked`);
    logger.log(`services.chats.updateByGuid -> chatGuid: ${chatGuid}`);
    logger.log(`services.chats.updateByGuid -> chat: ${JSON.stringify(chat)}`);

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
    const affectedUsers  = dbUsers.map( u => ({_id: u._id, email: u.email, isOnline: u.isOnline}) );
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