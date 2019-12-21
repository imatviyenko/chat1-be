const config = {
    environment: process.env.NODE_ENV || 'development',
    frontEndUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    port: process.env.PORT || 3001,
    mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chat1',
    serverSecret: process.env.SERVER_SECRET || 'secret123', // server secret string which is used for server side encryption and digital signature verification
    jwtIssuer: 'chat1-be_issuer',
    jwtAudience: 'chat1-be_audience',
    jwtLifetimeSeconds: 86400 // auth token is valid for 24 hours
};

module.exports = config;