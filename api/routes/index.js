const express = require('express');
const router = express.Router();

require('./test')(router, 'test');
require('./registration')(router, 'registration');

module.exports = router;