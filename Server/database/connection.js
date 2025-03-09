const mongoose = require("mongoose");

const URL = "mongodb://localhost:27017/ChattApp";
const mongodbConnection = async () => {
  try {
    await mongoose
      .connect(URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => console.log("MongoDB Connected"));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = mongodbConnection;
