const UpdateUserOnlineStatus = require('../models/UpdateUserOnlineStatus');
const {eventEmmiterUserOnlineStatus, EVENT_USER_ONLINE} = require('../../../events');

const initWatchers = () => {

    UpdateUserOnlineStatus.watch().on('change', data => {
        console.log(`watchers.UpdateUserOnlineStatus.change -> data: ${JSON.stringify(data)}`);
        const operationType = data && data.operationType;
        if (!operationType) return;

        switch (operationType) {
            
            case 'insert':
                const eventData = {
                    userId: data.fullDocument.userId,
                    affectedUsers: data.fullDocument.affectedUsers
                }
                eventEmmiterUserOnlineStatus.emit(EVENT_USER_ONLINE, eventData);
                return;
        }
        
    
        /*
        // Get the list of online users who have the current user in their contacts list
        */
    
    });
    
}

module.exports = initWatchers;