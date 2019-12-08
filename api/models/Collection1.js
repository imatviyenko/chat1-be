const mongoose = require('mongoose');

const Collection1Schema = new mongoose.Schema({
  index: Number,
  title: String
});

var mongoDbCollectionName = 'collection1';
var Collection1Model = mongoose.model(mongoDbCollectionName, Collection1Schema);

module.exports = Collection1Model;