const express = require('express');
const router = express.Router();

require('./test')(router);
require('./registration')(router);
require('./auth')(router);
require('./profile')(router);
require('./contacts')(router);
require('./chats')(router);

module.exports = router;