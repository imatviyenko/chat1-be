const logger = require('./logger');

const express = require('express');
const cors = require('cors');

const constant = require('./constants');
const {errorHandler, createError} = require('./errors');

var app = express();
app.use(cors());
app.use(express.json());



const mainRooter = require('./api/routes');
app.use('/', mainRooter);

// if we got to this middleware, then no other middlewares processed the request and therefore we should return '404 Not Found'
app.use(function(req, res, next) {
    const message = `Default catch all route invoked, req.url: ${req.url}`;
    next(createError(message, constant.ERROR_INVALID_PARAMETERS, 404));
});

// Centralized error handler
app.use(errorHandler);


module.exports = app;