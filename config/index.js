const environment = process.env.NODE_ENV || 'development';

const config = {
    environment,
    port: process.env.PORT || 3001,
    mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chat1'
};

module.exports = config;