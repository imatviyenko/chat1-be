const WebSocket = require('ws');

const constants = require('../constants');
const services = require('../api/services');
const {eventEmmiterWatcher} = require('../api/events');

const openSockets = {};

const wss = new WebSocket.Server({ noServer: true });
wss.on('connection', async (ws, request) => {
    openSockets[request.user._id] = ws; // store reference for the active web socket for user with the specified _id in a hash table

    ws.on('close', async () => {
        console.log(`socket closed for  user with email ${request.user.email}`);
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

const brodcastMessageToAffectedUsers = (wsMessage, affectedUsers) => {
    if (Array.isArray(affectedUsers)) {
        affectedUsers.forEach( affectedUserId => {
            const ws = openSockets[affectedUserId];
            if (ws) ws.send(JSON.stringify(wsMessage));
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

}



async function onUpgrade(request, socket, head) {
    //console.log(`server.on.upgrade -> request.headers: ${JSON.stringify(request.headers)}`);
    const token = request.headers && request.headers['sec-websocket-protocol'];
    console.log(`server.on.upgrade -> token: ${token}`);

    let user = null;
    if (token) {
        try {
            const jwtPayload = services.crypto.decodeAuthToken(token);
            console.log(`server.on.upgrade -> jwtPayload: ${JSON.stringify(jwtPayload)}`);
            if (jwtPayload) {
                user = await services.database.users.getByEmailStatus(jwtPayload.sub, constants.USER_STATUS_ACTIVE); // sub field of jwt token should contain user email
                console.log(`server.on.upgrade -> user: ${JSON.stringify(user)}`);
                if (!user) {
                    console.error(`server.on.upgrade -> error: User not found`);
                }
            }
        } catch (e) {
            console.error(`server.on.upgrade -> error: ${JSON.stringify(e)}`);
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
    onUpgrade
}