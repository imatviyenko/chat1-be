const chats_get = require('./chats_get');
const chats_put = require('./chats_put');
const chats_post = require('./chats_post');

module.exports = function(router) {
    chats_get(router);
    chats_put(router);
    chats_post(router);
}
