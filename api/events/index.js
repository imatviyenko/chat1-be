const events = require('events');

const eventEmmiterUserOnlineStatus = new events.EventEmitter();


const EVENT_USER_ONLINE = 'EVENT_USER_ONLINE';
const EVENT_USER_OFFLINE = 'EVENT_USER_OFFLINE';

module.exports = {
    eventEmmiterUserOnlineStatus,
    EVENT_USER_ONLINE,
    EVENT_USER_OFFLINE
}