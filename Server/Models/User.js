const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  images: {
    type: String,
    default: "/uploads/React.png",
  },
  token: {
    type: String,
  },
});

const Users = mongoose.model("User", userSchema);
module.exports = Users;
