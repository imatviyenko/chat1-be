const {serializeError} = require('serialize-error');

const log = message => {
    const _message = `${(new Date()).toISOString()}\t${message}`;
    console.log(_message);
};

const error = message => {
    const _message = `${(new Date()).toISOString()} \t ${JSON.stringify(serializeError(message))}`;
    console.error(_message);
};

const logger = {
    log,
    error
};

module.exports = logger;