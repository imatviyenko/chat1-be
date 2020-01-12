const mongoose = require('mongoose');

const schemaOptions = {
  collection: 'chats',
  strict: true, // ignore fields not defined in the schema
  timestamps: true // add createdAt and updatedAt fields
};

const schema = new mongoose.Schema(
  {
    guid: { type: String, required: true}, // use string type for guids instead of the more perfomant binary uuid type for ease of implementation
    displayName: { type: String, required: true },
    type: { type: String, required: true },
    lastMessageTimestamp:  { type: Date, required: false }, // the timestamp for the moment when the last message to this chat was posted, used for sorting
    users: [
      {
        _id: { type : mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
        email: { type : String, index: true, required: true},
        cutoffSequenceNumber: { type : Number } // this chat's messages with sequence numbers less than this value will not be fetched for this user
      }
    ]
  },
  schemaOptions
);


var model = mongoose.model('Chat', schema);
module.exports = model;