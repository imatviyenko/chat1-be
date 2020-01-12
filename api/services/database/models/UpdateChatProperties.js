const mongoose = require('mongoose');

const schemaOptions = {
  collection: 'updatesChatProperties',
  strict: true, // ignore fields not defined in the schema
  timestamps: true, // add createdAt and updatedAt fields
  capped: 100000
};

const schema = new mongoose.Schema(
  {
    chatGuid: { type: String, index: true, required: true },
    affectedUsers: [{ type : mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  schemaOptions
);


var model = mongoose.model('UpdateChatProperties', schema);
module.exports = model;