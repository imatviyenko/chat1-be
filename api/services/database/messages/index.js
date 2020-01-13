const constants = require('../../../../constants');
const config = require('../../../../config');
const {createError} = require('../../../../errors');
const Chat = require('../models/Chat');
const User = require('../models/User');
const UpdateChatMessages = require('../models/UpdateChatMessages');
const {usersEmailsToDbUsers} = require('../users');
const chats = require('../chats');


function dateAfterWithConfiguredPrecision(cutoffDateAfter) {
    return cutoffDateAfter && cutoffDateAfter instanceof Date && cutoffDateAfter.setSeconds(cutoffDateAfter.getSeconds() - config.messageTimestampPrecisionSeconds);
}


function dateBeforeWithConfigurePrecision(cutoffDateBefore) {
    return cutoffDateBefore && cutoffDateBefore instanceof Date && cutoffDateBefore.setSeconds(cutoffDateBefore.getSeconds() + config.messageTimestampPrecisionSeconds);
}

// get chats where the user specified by email is participating
async function getMessages(chatGuid, userEmail, cutoffDateAfter, cutoffDateBefore) {
    let createdAtFilter = null;
    const dbChat = await chats.getByGuid(chatGuid);
    const dbChatUser = dbChat.users.find( u => u.email.toLowerCase() === userEmail.toLowerCase());
    const chatLastReadMessageTimestamp = dbChatUser.lastReadMessageTimestamp;
    const chatDeletedMessagesCutoffTimestamp = dbChatUser.deletedMessagesCutoffTimestamp;

    // allow for message timestamps to be of less than perfect precision
    // it's safer to return more messages from the database including some duplicates and filter them out on the front-end than to miss some messages
    const _cutoffDateAfter = dateAfterWithConfiguredPrecision(cutoffDateAfter);
    const _cutoffDateBefore = dateBeforeWithConfigurePrecision(cutoffDateBefore);
    console.log(`services.messages.getMessages -> cutoffDateAfter: ${cutoffDateAfter}`);
    console.log(`services.messages.getMessages -> _cutoffDateAfter: ${_cutoffDateAfter}`);
    console.log(`services.messages.getMessages -> cutoffDateBefore: ${cutoffDateBefore}`);
    console.log(`services.messages.getMessages -> _cutoffDateBefore: ${_cutoffDateBefore}`);

    if (_cutoffDateAfter) {
        createdAtFilter = createdAtFilter || {};
        createdAtFilter[$gte] = _cutoffDateAfter;
    }
    
    if (_cutoffDateBefore) {
        createdAtFilter = createdAtFilter || {};
        createdAtFilter[$lte] = _cutoffDateBefore;
    } 

    // if both cutoffDateAfter and cutoffDateBefore are null, than means this is the first request from the front-end
    // in this case we must return all messages after chat.lastReadMessageTimestamp for the calling user
    if (!_cutoffDateBefore && !_cutoffDateBefore && chatLastReadMessageTimestamp) {
        createdAtFilter = createdAtFilter || {};
        createdAtFilter[$gte] = dateAfterWithConfiguredPrecision(chatLastReadMessageTimestamp);
    }

    // make sure we return only messages created after chat.deletedMessagesCutoffTimestamp for the calling user
    if (chatDeletedMessagesCutoffTimestamp) {
        _chatDeletedMessagesCutoffTimestamp = dateAfterWithConfiguredPrecision(chatDeletedMessagesCutoffTimestamp);
        if (createdAtFilter && createdAtFilter[$gte]) {
            createdAtFilter[$gte] = _chatDeletedMessagesCutoffTimestamp > createdAtFilter[$gte] ?
                _chatDeletedMessagesCutoffTimestamp
                :
                createdAtFilter[$gte];
        }
        else {
            createdAtFilter = createdAtFilter || {};
            createdAtFilter[$gte] = _chatDeletedMessagesCutoffTimestamp;
        }
    }

    const queryLiteral = {
        chatGuid 
    };
    if (createdAtFilter) queryLiteral['createdAt'] = createdAtFilter;

    const query = Chat.find(queryLiteral);
    return query.lean().limit(config.dbQueryResultCountLimit).exec();
}

// create new message
async function create(message) {
    const dbMessage = await message.save();
    console.log(`services.messages.create -> message: ${JSON.stringify(message)}`);
    console.log(`services.messages.create -> dbMessage: ${JSON.stringify(dbMessage)}`);

    // add record to the capped collection UpdateChatMessages monitored by back-end server instances via the MongoDB Change Stream feature 
    // this will trigger watcher components of the back-end server instances to notify the connected WebSocket clients that there are new messsages in the chat
    const dbChat = await chats.getByGuid(message.chatGuid);
    const userEmails = dbChat.users.map( u => u.email);
    const dbUsers = await usersEmailsToDbUsers(userEmails);
    const affectedUsers  = dbUsers.map( u => ({_id: u._id, email: u.email, isOnline: u.isOnline}) );
    const docUpdateChatProperties = new UpdateChatMessages({
        chatGuid: chat.guid,
        affectedUsers
    });
    await docUpdateChatProperties.save();
}




module.exports = {
    getMessages,
    create
};