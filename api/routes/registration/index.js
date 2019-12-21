const register_post = require('./register_post');
const register_get = require('./register_get');
const confirm_post = require('./confirm_post');

module.exports = function(router) {
    register_post(router);
    register_get(router);
    confirm_post(router);
}
