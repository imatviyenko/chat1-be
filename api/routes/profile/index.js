const profile_get = require('./profile_get');
const profile_put = require('./profile_put');

module.exports = function(router) {
    profile_get(router);
    profile_put(router);
}
