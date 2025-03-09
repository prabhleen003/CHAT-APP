const express = require("express");
const Users = require("../Models/User");
const Conversations = require("../Models/Conversation");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { senderId, recieverId } = req.body;
    const newConversation = new Conversations({
      members: [senderId, recieverId],
      lastMessage: Date.now(),
    });
    await newConversation.save();
    res.status(200).send("converstaion created sucessfully");
  } catch (error) {
    console.log("error", error);
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const conversations = await Conversations.find({
      members: { $in: [userId] },
    }).sort({ lastMessage: -1 });
    const conversationUserData = Promise.all(
      conversations.map(async (conversation) => {
        const recieverId = conversation.members.find(
          (member) => member !== userId
        );
        const user = await Users.findById(recieverId);

        return {
          user: {
            recieverId: user._id,
            email: user.email,
            fullName: user.fullName,
            images: user.images,
          },
          conversationId: conversation._id,
        };
      })
    );
    res.status(200).json(await conversationUserData);
  } catch (error) {
    res
      .status(500)
      .send("Failed to retrieve conversations. Please try again later.");
  }
});

module.exports = router;
