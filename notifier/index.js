const logger = require('../logger');

const WebSocket = require('ws');

const constants = require('../constants');
const services = require('../api/services');
const {eventEmmiterWatcher} = require('../api/events');

const openSockets = {};

/*
// Reset online status for all users when back-end server is restarted
// Due to limitations of the current implementation, all back-end server instaces must be started before first users connects to the system, 
// because each server instance resets users' online status when it initializes
// (async () => {await services.database.users.resetAllUsersOnlineStatus()})();
*/



const wss = new WebSocket.Server({ noServer: true });
wss.on('connection', async (ws, request) => {
    openSockets[request.user._id] = ws; // store reference for the active web socket for user with the specified _id in a hash table

    ws.on('close', async () => {
        logger.log(`socket closed for user with email ${request.user.email}`);
        delete openSockets[request.user._id];

        try {
            await services.database.users.setUserOnlineStatus(request.user._id, false);
        } catch(e) {
            logger.error(`Error updating user online status in database:`);
            logger.error(e);
        };
    });

    try {
        await services.database.users.setUserOnlineStatus(request.user._id, true);
    } catch(e) {
        logger.error(`Error updating user online status in database:`);
        logger.error(e);
    };


    ws.on('message', async messageString => {
        if (messageString) {
            logger.log(`ws.on.message -> messageString: ${messageString}`);
    
            try {
                const message = JSON.parse(messageString);
                if (message && message.token) {
                    const jwtPayload = services.crypto.decodeAuthToken(message.token);
                    logger.log(`ws.on.message -> jwtPayload.sub: ${jwtPayload && jwtPayload.sub}`);
                    if (jwtPayload) {
                        await services.database.users.updateUserOnlinePingTimestamp(jwtPayload.sub); // sub field of jwt token should contain user email
                    }
                }
            } catch (e) {
                logger.error(`ws.on.message -> error:`);
                logger.error(e);
            }
        } else {
            logger.error(`ws.on.message -> error: Empty message recieved from the client`);
        }
    });
});


const brodcastMessageToAffectedUsers = async (wsMessage, affectedUsers) => {
    if (Array.isArray(affectedUsers)) {
        affectedUsers.forEach( async affectedUser => {
            logger.log(`notifier.brodcastMessageToAffectedUsers -> affectedUser: ${JSON.stringify(affectedUser)}`);
            if (affectedUser.isOnline) {
                const ws = openSockets[affectedUser._id];
                if (ws) await ws.send(JSON.stringify(wsMessage));
            }
        });
    }
};


const notifyOfflineUsersUnreadMessages = async (chatType, chatDisplayName, authorEmail, affectedUsers) => {
    logger.log(`notifyOfflineUsersUnreadMessages -> chatType: ${chatType}, chatDisplayName: ${chatDisplayName}, authorEmail: ${authorEmail}`);
    if (Array.isArray(affectedUsers)) {
        const offlineUsers = affectedUsers.filter( affectedUser => !affectedUser.isOnline && affectedUser.email.toLowerCase() !== authorEmail.toLowerCase());
        const promises = offlineUsers.map( async offlineUser => {
            // send email to offline user
            try {
                logger.log(`notifyOfflineUsersUnreadMessages -> offlineUser.email: ${offlineUser.email}`);
                await services.email.sendNewMessagesNotification(offlineUser.email, offlineUser.displayName, authorEmail, chatType, chatDisplayName); // call async function without await
            } catch (e) {
                logger.error(`notifyOfflineUsersUnreadMessages -> error:`);
                logger.error(e);
            };
        });
        await Promise.all(promises); // await while email alerts for all offline users are registerd in the database
    }
};

const initEvents = () => {
    
    eventEmmiterWatcher.on(constants.EVENT_USER_ONLINE, data => {
        logger.log(`ws.eventEmmiterWatcher.on.EVENT_USER_ONLINE -> data: ${JSON.stringify(data)}`);
        const wsMessage = {
            event: constants.EVENT_USER_ONLINE,
            data: data.user.email
        };
        brodcastMessageToAffectedUsers(wsMessage, data.affectedUsers);
    });

    eventEmmiterWatcher.on(constants.EVENT_USER_OFFLINE, data => {
        logger.log(`ws.eventEmmiterWatcher.onEVENT_USER_OFFLINE -> data: ${JSON.stringify(data)}`);
        const wsMessage = {
            event: constants.EVENT_USER_OFFLINE,
            data: data.user.email
        };
        brodcastMessageToAffectedUsers(wsMessage, data.affectedUsers);
    });

    eventEmmiterWatcher.on(constants.EVENT_USER_PROFILE_UPDATED, data => {
        logger.log(`ws.eventEmmiterWatcher.onEVENT_USER_PROFILE_UPDATED -> data: ${JSON.stringify(data)}`);
        const wsMessage = {
            event: constants.EVENT_USER_PROFILE_UPDATED,
            data: data.user
        };
        brodcastMessageToAffectedUsers(wsMessage, data.affectedUsers);
    });    

    eventEmmiterWatcher.on(constants.EVENT_CHAT_UPDATED, data => {
        logger.log(`ws.eventEmmiterWatcher.onEVENT_CHAT_UPDATED -> data: ${JSON.stringify(data)}`);
        const wsMessage = {
            event: constants.EVENT_CHAT_UPDATED,
            data: data.chat
        };
        brodcastMessageToAffectedUsers(wsMessage, data.affectedUsers);
    });

    eventEmmiterWatcher.on(constants.EVENT_CHAT_NEW_MESSAGES, data => {
        logger.log(`ws.eventEmmiterWatcher.onEVENT_CHAT_NEW_MESSAGES -> data: ${JSON.stringify(data)}`);
        const wsMessage = {
            event: constants.EVENT_CHAT_NEW_MESSAGES,
            data: {
                chatGuid: data.chatGuid,
                sequenceNumber: data.sequenceNumber
            }
        };
        brodcastMessageToAffectedUsers(wsMessage, data.affectedUsers);
        notifyOfflineUsersUnreadMessages(data.chatType, data.chatDisplayName, data.authorEmail, data.affectedUsers);
    });
}



async function onWebSocketUpgrade(request, socket, head) {
    const token = request.headers && request.headers['sec-websocket-protocol'];
    logger.log(`onWebSocketUpgrade -> token: ${token}`);

    let user = null;
    if (token) {
        try {
            const jwtPayload = services.crypto.decodeAuthToken(token);
            logger.log(`onWebSocketUpgrade -> jwtPayload: ${JSON.stringify(jwtPayload)}`);
            if (jwtPayload) {
                user = await services.database.users.getByEmailStatus(jwtPayload.sub, constants.USER_STATUS_ACTIVE); // sub field of jwt token should contain user email
                logger.log(`onWebSocketUpgrade -> user: ${JSON.stringify(user)}`);
                if (!user) {
                    logger.error(`onWebSocketUpgrade -> error: User not found`);
                }
            }
        } catch (e) {
            logger.error(`onWebSocketUpgrade -> error:`);
            logger.error(e);
        }
    }
  
    if (!user) {
        socket.destroy();
        return;
    }

    // save authenticated user information in the request object
    request.user = user;

    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request, user);
    });
}

module.exports = {
    initEvents,
    onWebSocketUpgrade
}