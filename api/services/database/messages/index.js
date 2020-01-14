const constants = require('../../../../constants');
const config = require('../../../../config');
const Message = require('../models/Message');
const UpdateChatMessages = require('../models/UpdateChatMessages');
const {usersEmailsToDbUsers} = require('../users');
const chats = require('../chats');
const {getNextSequenceNumber} = require('../sequences');


// create new message
async function create(message) {
    console.log(`services.messages.create invoked`);
    if (!message.sequenceNumber) message.sequenceNumber = await(getNextSequenceNumber('messages'));
    const docMessage = new Message(message);
    const dbMessage = await docMessage.save();

    console.log(`services.messages.create -> message: ${JSON.stringify(message)}`);
    console.log(`services.messages.create -> dbMessage: ${JSON.stringify(dbMessage)}`);

    // add record to the capped collection UpdateChatMessages monitored by back-end server instances via the MongoDB Change Stream feature 
    // this will trigger watcher components of the back-end server instances to notify the connected WebSocket clients that there are new messsages in the chat
    const dbChat = await chats.getByGuid(message.chatGuid);
    console.log(`services.messages.create -> dbChat: ${JSON.stringify(dbChat)}`);
    const userEmails = dbChat.users.filter(u => u.email !== message.authorEmail).map( u => u.email);
    const dbUsers = await usersEmailsToDbUsers(userEmails);
    const affectedUsers  = dbUsers.map( u => ({_id: u._id, email: u.email, isOnline: u.isOnline}) );
    const docUpdateChatProperties = new UpdateChatMessages({
        chatGuid: dbChat.guid,
        chatDisplayName: dbChat.displayName,
        chatType: dbChat.type,
        sequenceNumber: dbMessage.sequenceNumber,
        authorEmail: message.authorEmail,
        affectedUsers
    });
    await docUpdateChatProperties.save();
}


async function getMessages(chatGuid, userEmail, sequenceNumberAfter, sequenceNumberBefore) {
    console.log(`services.messages.getMessages invoked`);

    console.log(`services.messages.getMessages -> sequenceNumberAfter: ${sequenceNumberAfter}`);
    console.log(`services.messages.getMessages -> sequenceNumberBefore: ${sequenceNumberBefore}`);

    let sequenceNumberFilter = null;
    const dbChat = await chats.getByGuid(chatGuid);
    const dbChatUser = dbChat.users.find( u => u.email.toLowerCase() === userEmail.toLowerCase());
    const chatLastReadMessageSequenceNumber = dbChatUser.lastReadMessageSequenceNumber;
    const chatDeletedMessagesSequenceNumber = dbChatUser.deletedMessagesSequenceNumber;
    console.log(`services.messages.getMessages -> dbChat: ${JSON.stringify(dbChat)}`);
    console.log(`services.messages.getMessages -> dbChatUser: ${JSON.stringify(dbChatUser)}`);
    console.log(`services.messages.getMessages -> chatLastReadMessageSequenceNumber: ${chatLastReadMessageSequenceNumber}`);
    console.log(`services.messages.getMessages -> chatDeletedMessagesSequenceNumber: ${chatDeletedMessagesSequenceNumber}`);

    if (sequenceNumberAfter) {
        sequenceNumberFilter = sequenceNumberFilter || {};
        sequenceNumberFilter['$gt'] = sequenceNumberAfter;
    };

    if (sequenceNumberBefore) {
        sequenceNumberFilter = sequenceNumberFilter || {};
        sequenceNumberFilter['$lt'] = sequenceNumberBefore;
    };


    // if both sequenceNumberAfter and sequenceNumberBefore are null, than means this is the first request from the front-end
    // in this case we must return all messages after chat.lastReadMessageTimestamp for the calling user
    if (!sequenceNumberAfter && !sequenceNumberBefore && chatLastReadMessageSequenceNumber) {
        sequenceNumberFilter = sequenceNumberFilter || {};
        sequenceNumberFilter['$gt'] = chatLastReadMessageSequenceNumber;
    }


    // make sure we return only messages created after chatDeletedMessagesSequenceNumber for the calling user
    if (chatDeletedMessagesSequenceNumber) {
        if (sequenceNumberFilter && sequenceNumberFilter['$gt']) {
            sequenceNumberFilter['$gt'] = chatDeletedMessagesSequenceNumber > sequenceNumberFilter['$gt'] ?
                chatDeletedMessagesSequenceNumber
                :
                sequenceNumberFilter['$gt'];
        }
        else {
            sequenceNumberFilter = sequenceNumberFilter || {};
            sequenceNumberFilter['$gt'] = _chatDeletedMessagesCutoffTimestamp;
        }
    }

    const queryLiteral = {
        chatGuid
    };
    if (sequenceNumberFilter) queryLiteral['sequenceNumber'] = sequenceNumberFilter;
    
    console.log(`services.messages.getMessages -> queryLiteral: ${JSON.stringify(queryLiteral)}`);
    const query = Message.find(queryLiteral);
    const filteredMessages =  await query.lean().sort({ $natural: -1 }).limit(config.dbQueryResultCountLimit).exec();

    if (filteredMessages.length >= config.returnUnfilteredMessagesThreshold) return filteredMessages;

    // if we got here, this means that the filtered query yielded less than config.returnUnfilteredMessagesThreshold messages
    // in this case to improve user expirience we fetch top latest config.returnUnfilteredMessagesLimit messages for the current chat without additional filters
    return Message.find({chatGuid}).lean().sort({ $natural: -1 }).limit(config.returnUnfilteredMessagesLimit).exec();
}




module.exports = {
    getMessages,
    create
};