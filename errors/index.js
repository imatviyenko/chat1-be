const logger = require('../logger');

const {serializeError} = require('serialize-error');
const constants = require('../constants');

const errorToString = e => JSON.stringify(serializeError(e));

function createError(message, resultStatus = constants.ERROR_GENERIC_SERVER_FAILURE, httpStatus = 500, data) {
    return createCustomError.apply(null, ['Error', ...arguments]);
}


function createCustomError(name, message, resultStatus = constants.ERROR_GENERIC_SERVER_FAILURE, httpStatus = 500, data) {
    const e = new Error(message);
    e.name = name;
    e.resultStatus = resultStatus;
    e.httpStatus = httpStatus;
    e.data = serializeError(data);
    return e;
};




function errorHandler(error, req, res, next) {
    logger.error(`Error handling middleware invoked, req.url: ${req.url}, error: ${errorToString(error)}`);
    return res
        .status(error.httpStatus || 500)
        .json({
            status: error.resultStatus,
            message: error.message,
            data: error.data
        });
}


module.exports = {
    errorToString,
    createError,
    createCustomError,
    errorHandler
};