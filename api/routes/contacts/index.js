const contacts_get = require('./contacts_get');
const contacts_post = require('./contacts_post');

module.exports = function(router) {
    contacts_get(router);
    contacts_post(router);
}
