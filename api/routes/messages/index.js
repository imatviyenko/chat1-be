const messages_get = require('./messages_get');
const messages_post = require('./messages_post');

module.exports = function(router) {
    messages_get(router);
    messages_post(router);
}
