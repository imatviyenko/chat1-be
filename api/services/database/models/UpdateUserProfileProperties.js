const mongoose = require('mongoose');

const schemaOptions = {
  collection: 'updatesUserProfileProperties',
  strict: true, // ignore fields not defined in the schema
  timestamps: true, // add createdAt and updatedAt fields
  capped: 100000
};

const schema = new mongoose.Schema(
  {
    userId: { type : mongoose.Schema.Types.ObjectId, index: true, required: true },
    affectedUsers: [{ type : mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  schemaOptions
);


var model = mongoose.model('UpdateUserProfileProperties', schema);
module.exports = model;