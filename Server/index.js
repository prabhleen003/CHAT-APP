const express = require("express");
const http = require("http");
const mongodbConnection = require("./database/connection.js");
const socketIo = require("socket.io");
const userRouter = require("./Router/authentic.js");
const msgRouter = require("./Router/message.js");
const convRouter = require("./Router/conversations.js");
const Users = require("./Models/User.js");
const cors = require("cors");
const path = require("path");

const port = 9000;

const app = express();
const server = http.createServer(app); // Create an HTTP server

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

let users = [];

io.on("connection", (socket) => {
  socket.on("addUser", (userId) => {
    const isUserExist = users.find((user) => user.userId === userId);
    if (!isUserExist) {
      console.log("User connected  AS before not exist", socket.id);
      const user = { userId, socketId: socket.id };
      users.push(user);
      io.emit("getUsers", users);
    }
  });

  socket.on(
    "sendMessage",
    async ({ senderId, recieverId, message, conversationId }) => {
      const receiver = users.find((user) => user.userId === recieverId);
      const sender = users.find((user) => user.userId === senderId);
      console.log(
        `i am sending message using sender ${sender}to reciever${receiver}`
      );

      //       const user = await Users.findById(senderId);
      // const senderDetails = await Users.findById(senderId);

      if (receiver) {
        // Emit getMessage event to the receiver
        io.to(receiver.socketId)
          // .to(sender.socketId) //           .to(sender)
          .emit("getMessage", {
            senderId,
            message,
            conversationId,
            recieverId,
            user: {
              id: senderId, //id: user._id
              fullName: sender.fullName,
              email: sender.email,
            },
          });

        console.log("Message sent to receiver:", receiver.userId);
      }
      //else {
      //   io.to(sender.socketId).emit("getMessage", {
      //     senderId,
      //     message,
      //     conversationId,
      //     recieverId,
      //     user: {
      //       id: senderId,
      //       fullName: sender.fullName,
      //       email: sender.email,
      //     },
      //   });
      //   console.log("Receiver not found or disconnected:", recieverId);
      //   // Handle case where receiver is not found or disconnected
      // }
    }
  );
  // socket.on("addConversation", async (conversationData) => {
  //   // Save the conversation in the database
  //   const newConversation = await saveConversation(conversationData); // Adjust according to your data handling

  //   // Emit an event to all clients with the updated conversations
  //   io.emit("updateConversations", await fetchAllConversations()); // Function to fetch all conversations
  // });

  socket.on("disconnect", () => {
    users = users.filter((user) => user.socketId !== socket.id);
    io.emit("getUsers", users);
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });
});

app.use("/api/conversations", convRouter);
app.use("/api", userRouter);
app.use("/api/", msgRouter);

mongodbConnection();

server.listen(port, () => {
  console.log(`Listening on port number ${port}`);
});
