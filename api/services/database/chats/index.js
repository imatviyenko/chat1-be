const constants = require('../../../../constants');
const {createError} = require('../../../../errors');
const Chat = require('../models/Chat');
const User = require('../models/User')


// get chats where the user specified by email is participating
async function getByUserEmail(userEmail) {
    const queryLiteral = {
        "users.email": userEmail
    };

    const query = Chat.find(queryLiteral);
    return query.lean().exec();
}


// create new chat
async function create(chat) {
    // convert chat.usersEmails to dbUsers
    let dbUsers = [];
    if (Array.isArray(chat.usersEmails)) {
        const dbUsersPromises = chat.usersEmails.map( async userEmail => {
            console.log(`services.chats.create -> userEmail: ${userEmail}`);        
            const dbUser = await User.findOne({email: userEmail.toLowerCase()}).lean().exec();
            console.log(`services.chats.create -> dbUser: ${JSON.stringify(dbUser)}`);
            if (!dbUser) throw createError(`services.database.chats.create -> Could not find user by email ${userEmail}`);
            dbUsers.push(dbUser);
        });

        await Promise.all(dbUsersPromises);
    }

    console.log(`services.chats.create -> chat:`);
    console.log(JSON.stringify(chat));

    console.log(`services.chats.create -> dbUsers:`);
    console.log(JSON.stringify(dbUsers));


    const docChat = new Chat({
        displayName: chat.displayName,
        type: chat.type,
        users: dbUsers
    });
    return docChat.save();
}


module.exports = {
    create,
    getByUserEmail
};