const Collection1 = require('../../models/Collection1');

module.exports = function(router, path) {
    router.get(`/${path}`, function(req, res) {  
        console.log(`\nHandling GET request for path ${path}, timestamp: ${new Date().toString()}`);
        
        Collection1.find()
            .then( data => {
                console.log(`Count of documents retrieved from MongoDB: ${data.length}`);
                res.json(data);
            });
    });
}
