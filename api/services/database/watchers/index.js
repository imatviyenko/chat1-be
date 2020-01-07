const constants = require('../../../../constants');
const users = require('../users');
const UpdateUserOnlineStatus = require('../models/UpdateUserOnlineStatus');
const UpdateUserProfileProperties = require('../models/UpdateUserProfileProperties');
const {eventEmmiterWatcher} = require('../../../events');


const initWatchers = () => {

    UpdateUserOnlineStatus.watch().on('change', async data => {
        console.log(`watchers.UpdateUserOnlineStatus.change -> data: ${JSON.stringify(data)}`);
        const operationType = data && data.operationType;
        if (!operationType) return;

        switch (operationType) {
            
            case 'insert':
                const userId = data.fullDocument.userId;
                const dbUser = await users.getById(userId);
                const eventData = {
                    user: dbUser,
                    affectedUsers: data.fullDocument.affectedUsers
                }
                const event = data.fullDocument.isOnline ? constants.EVENT_USER_ONLINE : constants.EVENT_USER_OFFLINE;
                eventEmmiterWatcher.emit(event, eventData);
                return;
        }
    
    });
    

    UpdateUserProfileProperties.watch().on('change', async data => {
        console.log(`watchers.UpdateUserProfileProperties.change -> data: ${JSON.stringify(data)}`);
        const operationType = data && data.operationType;
        if (!operationType) return;

        switch (operationType) {
            
            case 'insert':
                const userId = data.fullDocument.userId;
                const dbUser = await users.getById(userId);
                const eventData = {
                    user: dbUser,
                    affectedUsers: data.fullDocument.affectedUsers
                }
                const event = constants.EVENT_USER_PROFILE_UPDATED;
                eventEmmiterWatcher.emit(event, eventData);
                return;
        }
    
    });    
}

module.exports = initWatchers;