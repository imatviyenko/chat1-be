const logger = require('./logger');

const http = require('http');
const config = require('./config');


// Initialize Mongoose 
const initMongoose = require('./mongoose');
initMongoose();

// Initialize Express app
const expressApp = require('./expressApp');
const server = http.createServer(expressApp);

// Initialize WebSocket server instance
const {onWebSocketUpgrade, initEvents} = require('./notifier');
server.on('upgrade', onWebSocketUpgrade);
initEvents(); // start listening to events

// Start http server
const port = config.port;
server.listen(port, () => {
    logger.log(`Server started on port ${port}`);
});