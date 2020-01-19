const logger = require('./logger');

const mongoose = require('mongoose');

const config = require('./config');
const initWatchers = require('./api/services/database/watchers');


// Initialize Mongoose 
const initMongoose = async () => {
    const mongodbUri = config.mongodbUri;
    logger.log('mongodbUri: ', mongodbUri);
    await mongoose.connect(mongodbUri, {
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
    });

    // set up MongoDB change stream watchers
    initWatchers();
};

module.exports = initMongoose;