const WebSocket = require('ws');

const constants = require('../constants');
const services = require('../api/services');
const {eventEmmiterWatcher} = require('../api/events');

const openSockets = {};

// Reset online status for all users when back-end server is restarted
// Due to limitations of the current implementation, all back-end server instaces must be started before first users connects to the system, 
// because each server instance resets users' online status when it initializes
(async () => {await services.database.users.resetAllUsersOnlineStatus()})();



const wss = new WebSocket.Server({ noServer: true });
wss.on('connection', async (ws, request) => {
    openSockets[request.user._id] = ws; // store reference for the active web socket for user with the specified _id in a hash table

    ws.on('close', async () => {
        console.log(`socket closed for user with email ${request.user.email}`);
        delete openSockets[request.user._id];

        try {
            await services.database.users.setUserOnlineStatus(request.user._id, false);
        } catch(e) {
            console.error(`Error updating user online status in database:`);
            console.error(e);
        };
    });

    try {
        await services.database.users.setUserOnlineStatus(request.user._id, true);
    } catch(e) {
        console.error(`Error updating user online status in database:`);
        console.error(e);
    };


    /*
    ws.on('message', message => {
        console.log(`received from user with email ${request.user.email}: ${message}`);
        ws.send(`Hello ${request.user.displayName}, you sent -> ${message}`);
    });

    //send immediatly a feedback to the incoming connection    
    ws.send(`Hi there, I am a WebSocket server, and you are ${request.user.email}`);
    */
});

const brodcastMessageToAffectedUsers = async (wsMessage, affectedUsers) => {
    if (Array.isArray(affectedUsers)) {
        affectedUsers.forEach( async affectedUser => {
            console.log(`notifier.brodcastMessageToAffectedUsers -> affectedUser: ${JSON.stringify(affectedUser)}`);
            if (affectedUser.isOnline) {
                const ws = openSockets[affectedUser._id];
                if (ws) await ws.send(JSON.stringify(wsMessage));
            }
        });
    }
};


const notifyOfflineUsersUnreadMessages = (chatType, chatDisplayName, authorEmail, affectedUsers) => {
    console.log(`notifyOfflineUsersUnreadMessages -> chatType: ${chatType}, chatDisplayName: ${chatDisplayName}, authorEmail: ${authorEmail}`);
    if (Array.isArray(affectedUsers)) {
        affectedUsers.forEach( affectedUser => {
            if (!affectedUser.isOnline && affectedUser.email.toLowerCase() !== authorEmail.toLowerCase()) {
                // send email to offline user
                try {
                    console.log(`notifyOfflineUsersUnreadMessages -> affectedUser.email: ${affectedUser.email}`);
                    services.email.notifyOfflineUserUnreadMessages(affectedUser.email, authorEmail, chatType, chatDisplayName); // call async function without await
                } catch (e) {
                    console.error(`notifyOfflineUsersUnreadMessages -> error:`);
                    console.error(e);
                };
            }
        });
    }
};

const initEvents = () => {
    
    eventEmmiterWatcher.on(constants.EVENT_USER_ONLINE, data => {
        console.log(`ws.eventEmmiterWatcher.on.EVENT_USER_ONLINE -> data: ${JSON.stringify(data)}`);
        const wsMessage = {
            event: constants.EVENT_USER_ONLINE,
            data: data.user.email
        };
        brodcastMessageToAffectedUsers(wsMessage, data.affectedUsers);
    });

    eventEmmiterWatcher.on(constants.EVENT_USER_OFFLINE, data => {
        console.log(`ws.eventEmmiterWatcher.onEVENT_USER_OFFLINE -> data: ${JSON.stringify(data)}`);
        const wsMessage = {
            event: constants.EVENT_USER_OFFLINE,
            data: data.user.email
        };
        brodcastMessageToAffectedUsers(wsMessage, data.affectedUsers);
    });

    eventEmmiterWatcher.on(constants.EVENT_USER_PROFILE_UPDATED, data => {
        console.log(`ws.eventEmmiterWatcher.onEVENT_USER_PROFILE_UPDATED -> data: ${JSON.stringify(data)}`);
        const wsMessage = {
            event: constants.EVENT_USER_PROFILE_UPDATED,
            data: data.user
        };
        brodcastMessageToAffectedUsers(wsMessage, data.affectedUsers);
    });    

    eventEmmiterWatcher.on(constants.EVENT_CHAT_UPDATED, data => {
        console.log(`ws.eventEmmiterWatcher.onEVENT_CHAT_UPDATED -> data: ${JSON.stringify(data)}`);
        const wsMessage = {
            event: constants.EVENT_CHAT_UPDATED,
            data: data.chat
        };
        brodcastMessageToAffectedUsers(wsMessage, data.affectedUsers);
    });

    eventEmmiterWatcher.on(constants.EVENT_CHAT_NEW_MESSAGES, data => {
        console.log(`ws.eventEmmiterWatcher.onEVENT_CHAT_NEW_MESSAGES -> data: ${JSON.stringify(data)}`);
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
    console.log(`onWebSocketUpgrade -> token: ${token}`);

    let user = null;
    if (token) {
        try {
            const jwtPayload = services.crypto.decodeAuthToken(token);
            console.log(`onWebSocketUpgrade -> jwtPayload: ${JSON.stringify(jwtPayload)}`);
            if (jwtPayload) {
                user = await services.database.users.getByEmailStatus(jwtPayload.sub, constants.USER_STATUS_ACTIVE); // sub field of jwt token should contain user email
                console.log(`onWebSocketUpgrade -> user: ${JSON.stringify(user)}`);
                if (!user) {
                    console.error(`onWebSocketUpgrade -> error: User not found`);
                }
            }
        } catch (e) {
            console.error(`onWebSocketUpgrade -> error:`);
            console.error(e);
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