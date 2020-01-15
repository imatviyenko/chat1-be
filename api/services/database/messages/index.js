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
    const chatDeletedMessagesSequenceNumber = dbChatUser.deletedMessagesSequenceNumber;
    console.log(`services.messages.getMessages -> dbChat: ${JSON.stringify(dbChat)}`);
    console.log(`services.messages.getMessages -> dbChatUser: ${JSON.stringify(dbChatUser)}`);
    console.log(`services.messages.getMessages -> chatDeletedMessagesSequenceNumber: ${chatDeletedMessagesSequenceNumber}`);

    if (sequenceNumberAfter) {
        sequenceNumberFilter = sequenceNumberFilter || {};
        sequenceNumberFilter['$gt'] = sequenceNumberAfter;
    };

    if (sequenceNumberBefore) {
        sequenceNumberFilter = sequenceNumberFilter || {};
        sequenceNumberFilter['$lt'] = sequenceNumberBefore;
    };


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
    
    let query;
    let messages;

    // if this is a paged request for the most recent messages with no sequenceNumberAfter parameter and no sequenceNumberBefore parameter (first client call)
    if (!sequenceNumberAfter && !sequenceNumberBefore) {
        console.log(`services.messages.getMessages -> queryLiteral: ${JSON.stringify(queryLiteral)}`);
        query = Message.find(queryLiteral);
        // get at most config.dbQueryResultCountLimit messages with no filtering on the sequenceNumber field
        messages = await query.lean().sort({ $natural: -1 }).limit(config.dbQueryResultCountLimit).exec(); 
        console.log(`services.messages.getMessages -> config.dbQueryResultCountLimit: ${config.dbQueryResultCountLimit}`);
        console.log(`services.messages.getMessages -> messages.length: ${messages.length}`);

        // if we got config.dbQueryResultCountLimit number of messages then we return the messages and indicate that we probably have more older messages in the database moreDataAvailable = true
        // if we got less than this number of messages, then we have no more earlier messages and we return moreDataAvailable = false
        return {
            messages,
            moreDataAvailable: (messages.length === config.dbQueryResultCountLimit)
        };
    }


    // if this is a paged request for past messages BEFORE a certain sequence numnber
    if (sequenceNumberBefore && !sequenceNumberAfter) {
        queryLiteral['sequenceNumber'] = {'$lt': sequenceNumberBefore};
        console.log(`services.messages.getMessages -> queryLiteral: ${JSON.stringify(queryLiteral)}`);
        query = Message.find(queryLiteral);
        // get at most config.dbQueryResultCountLimit messages with sequence numbers ealrier than sequenceNumberBefore
        messages = await query.lean().sort({ $natural: -1 }).limit(config.dbQueryResultCountLimit).exec(); 
        console.log(`services.messages.getMessages -> config.dbQueryResultCountLimit: ${config.dbQueryResultCountLimit}`);
        console.log(`services.messages.getMessages -> messages.length: ${messages.length}`);

        // if we got config.dbQueryResultCountLimit number of messages then we return the messages and indicate that we probably have more older messages in the database moreDataAvailable = true
        // if we got less than this number of messages, then we have no more earlier messages and we return moreDataAvailable = false
        return {
            messages,
            moreDataAvailable: (messages.length === config.dbQueryResultCountLimit)
        };
    } 


    // if this is a request for messages AFTER a certain sequence number (delta since the last call) 
    // OR
    // a ranged query for messages with sequence number AFTER one value and BEFORE another value
    if (sequenceNumberAfter) {
        queryLiteral['sequenceNumber'] = {'$gt': sequenceNumberAfter};
        if (sequenceNumberBefore) queryLiteral['sequenceNumber']['$lt'] = sequenceNumberBefore;

        console.log(`services.messages.getMessages -> queryLiteral: ${JSON.stringify(queryLiteral)}`);
        query = Message.find(queryLiteral);
        // get all messages no matter how many we have - no limit is applied
        messages = await query.lean().sort({ $natural: -1 }).exec(); 

        // return message but do not return any value for moreDataAvailable
        return {
            messages
        };
    }
}




module.exports = {
    getMessages,
    create
};