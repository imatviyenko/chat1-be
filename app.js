const createError = require('http-errors');
const serializeError = require('serialize-error');

const express = require('express');
var app = express();

const cors = require('cors');
app.use(cors());

// API routes
const mainRooter = require('./api/routes');
app.use('/', mainRooter);

// if we got to this middleware, then no other middlewares processed the request and therefore we should return '404 Not Found'
app.use(function(req, res, next) {
    console.error("Default catch all route invoked");
    next(createError(404));
  });
  
  
// error handler
app.use(function(error, req, res, next) {
    console.error('Error handling middleware invoked');
    console.error(error);
    //console.error('Error handling middleware invoked', serializeError(error));
    return res
        .status(error.status || 500)
        .json({
            error
        });
});


module.exports = app;