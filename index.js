const http = require('http');
const config = require('./config');

// Initialize Mongoose 
const initMongoose = require('./mongoose');
initMongoose();

// Initialize Express app
const expressApp = require('./expressApp');
const server = http.createServer(expressApp);

// Initialize WebSocket server instance
const {onUpgrade, initEvents} = require('./ws');
server.on('upgrade', onUpgrade);
initEvents(); // start listening to events

// Start http server
const port = config.port;
server.listen(port, () => {
    console.log(`Server started on port ${server.address().port}`);
});