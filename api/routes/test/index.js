const Collection1 = require('../../models/Collection1');

module.exports = function(router) {
    router.get(`/test`, function(req, res) {  
        console.log(`\nHandling GET request for path /test, timestamp: ${new Date().toString()}`);
        
        Collection1.find()
            .then( data => {
                console.log(`Count of documents retrieved from MongoDB: ${data.length}`);
                res.json(data);
            });
    });
}
