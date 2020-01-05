const mongoose = require('mongoose');
const CounterModel = require('./Counter');

const schemaOptions = {
  collection: 'messages',
  strict: true, // ignore fields not defined in the schema
  timestamps: true // add createdAt and updatedAt fields
};

const schema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    chat: { type : mongoose.Schema.Types.ObjectId, ref: 'Chat', index: true },
    sequenceNumber: {type: Number, required: true}, // atuo incrementing sequence number of messages in one chat
    users: [{ type : mongoose.Schema.Types.ObjectId, ref: 'User', index: true }]
  },
  schemaOptions
);

// https://stackoverflow.com/questions/28357965/mongoose-auto-increment
schema.pre('save', async function() {
  // Don't increment if this is NOT a newly created document
  if(!this.isNew) return;

  const nextSequenceNumber = await CounterModel.increment('messages');
  this.sequenceNumber = nextSequenceNumber;
});


var model = mongoose.model('Chat', schema);
module.exports = model;