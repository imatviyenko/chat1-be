const config = {
    environment: process.env.NODE_ENV || 'development',
    frontEndUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    port: process.env.PORT || 3001,
    mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chat1',
    serverSecret: process.env.SERVER_SECRET || 'secret123' // server secret string which is used for server side encryption and digital signature verification
};

module.exports = config;