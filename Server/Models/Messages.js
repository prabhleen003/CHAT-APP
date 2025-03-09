const mongoose = require("mongoose");

const MessagesSchema = new mongoose.Schema({
  conversationId: {
    type: String,
  },
  senderId: {
    type: String,
  },
  messages: {
    type: String,
  },
  createdAt: { type: Date, default: Date.now },
});

const Messages = mongoose.model("message", MessagesSchema);
module.exports = Messages;
