const WebSocket = require('ws');

const constants = require('../constants');
const services = require('../api/services');
const {eventEmmiterUserOnlineStatus, EVENT_USER_ONLINE} = require('../api/events');

const openSockets = {};

const wss = new WebSocket.Server({ noServer: true });
wss.on('connection', async (ws, request) => {
    openSockets[request.user._id] = ws; // store reference for the active web socket for user with the specified _id in a hash table

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


const initEvents = () => {
    
    eventEmmiterUserOnlineStatus.on(EVENT_USER_ONLINE, data => {
        console.log(`ws.eventEmmiterUserOnlineStatus.on -> data: ${JSON.stringify(data)}`);

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