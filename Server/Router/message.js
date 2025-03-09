const express = require("express");
const Users = require("../Models/User");
const Conversations = require("../Models/Conversation");
const Messages = require("../Models/Messages");

const router = express.Router();

router.post("/message", async (req, res) => {
  try {
    const { conversationId, senderId, message, recieverId } = req.body;

    if (!senderId || !message) {
      return res
        .status(400)
        .json({ error: "All fields are required in messages" });
    }

    if (conversationId === "new" && recieverId) {
      const newConversation = new Conversations({
        members: [senderId, recieverId],
        lastMessage: Date.now(),
      });
      await newConversation.save();
      const newMessage = new Messages({
        conversationId: newConversation._id,
        senderId,
        messages: message,
      });
      await newMessage.save();
      return res
        .status(200)
        .json({ message: "Message sent successfully from new" });
    } else if (!conversationId && !recieverId) {
      return res
        .status(400)
        .json({ error: "Please fill all fields of messages" });
    } else {
      const updatedConversation = await Conversations.findByIdAndUpdate(
        conversationId,
        { $set: { lastMessage: Date.now() } },
        { new: true }
      );

      if (!updatedConversation) {
        return res.status(404).send("Conversation not found");
      }

      const newMessage = new Messages({
        conversationId,
        senderId,
        messages: message,
        //message
      });

      await newMessage.save();
      return res.status(200).json({
        message:
          "Message sent successfully and conversation updated sucessfully",
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Internal server error from messages " });
  }
});

router.get("/message/:conversationId", async (req, res) => {
  try {
    const checkMessages = async (conversationId) => {
      const messages = await Messages.find({ conversationId });
      const messageUserData = Promise.all(
        messages.map(async (message) => {
          const user = await Users.findById(message.senderId);
          return {
            user: { id: user._id, email: user.email, fullName: user.fullName },
            message: message.messages,
          };
        })
      );
      res.status(200).json(await messageUserData);
    };

    const conversationId = req.params.conversationId;

    if (conversationId === "new") {
      const checkConversation = await Conversations.find({
        members: { $all: [req.query.senderId, req.query.receiverId] },
      });

      if (checkConversation.length > 0) {
        // await checkMessages(checkConversation[0]._id);
        checkMessages(checkConversation[0]._id);
      } else {
        // const sender = req.query.senderId;
        // const rec = req.query.receiverId;

        return res.status(200).json([]);
      }
    } else {
      // await checkMessages(checkConversation[0]._id);
      checkMessages(conversationId);
    }
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Internal Server Error by getting messages" });
  }
});

module.exports = router;
