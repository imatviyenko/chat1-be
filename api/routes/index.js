const express = require('express');
const router = express.Router();

require('./test')(router);
require('./registration')(router);
require('./auth')(router);

module.exports = router;