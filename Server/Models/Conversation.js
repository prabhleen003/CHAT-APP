const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  members: {
    type: Array,
    required: true,
  },
  lastMessage: { type: Date, default: Date.now }
});

const Conversations = mongoose.model("Conversation", conversationSchema);
module.exports = Conversations;
