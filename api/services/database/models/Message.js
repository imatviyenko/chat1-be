const mongoose = require('mongoose');

const schemaOptions = {
  collection: 'messages',
  strict: true, // ignore fields not defined in the schema
  timestamps: true // add createdAt and updatedAt fields
};

const schema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    chatGuid: { type: String, required: true, index: true },
    authorEmail: { type: String, required: true }
  },
  schemaOptions
);

schema.index({ createdAt: 1 }); // schema level index on the automatically provisioned createdAt field

var model = mongoose.model('Message', schema);
module.exports = model;