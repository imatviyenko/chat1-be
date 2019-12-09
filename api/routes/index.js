const express = require('express');
const router = express.Router();

require('./test')(router, 'test');

module.exports = router;