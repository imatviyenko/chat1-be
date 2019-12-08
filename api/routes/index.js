const express = require('express');
const router = express.Router();

const Collection1 = require('../models/Collection1');

router.get('/', function(req, res) {  
    console.log(`\nHandling get request, timestamp: ${new Date().toString()}`);
    
    Collection1.find()
        .then( data => {
            console.log(`Count of documents retrieved from MongoDB: ${data.length}`);
            res.json(data);
        });
});


module.exports = router;