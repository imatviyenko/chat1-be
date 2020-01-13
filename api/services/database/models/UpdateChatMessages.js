const mongoose = require('mongoose');

const schemaOptions = {
  collection: 'updatesChatMessages',
  strict: true, // ignore fields not defined in the schema
  timestamps: true, // add createdAt and updatedAt fields
  capped: 100000
};

const schema = new mongoose.Schema(
  {
    chatGuid: { type: String, index: true, required: true },
    chatDisplayName: { type: String, required: true },
    chatType: { type: String, required: true },
    sequenceNumber: { type: Number, required: true },
    authorEmail: { type: String, required: true },
    affectedUsers: [
      {
        _id: { type : mongoose.Schema.Types.ObjectId, required: true },
        email: { type : String, required: true},
        isOnline: {type: Boolean}
      }
    ]
  },
  schemaOptions
);


var model = mongoose.model('UpdateChatMessages', schema);
module.exports = model;