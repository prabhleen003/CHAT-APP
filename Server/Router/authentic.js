const express = require("express");
const Users = require("../Models/User");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads"); // Specify the directory where files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); // Name the file with a timestamp to avoid duplicates
  },
});

// Initialize upload
const upload = multer({ storage: storage });

// Make sure the public/uploads directory exists
const fs = require("fs");
const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Please enter all fields" });
    }

    const isAlreadyExist = await Users.findOne({ email });
    if (isAlreadyExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const newUser = new Users({ fullName, email, password: hashedPassword });

    await newUser.save();
    return res.status(200).json({ message: "User registered successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { password, email } = req.body;

    if (!email || !password) {
      return res.status(400).send("Please enter all fields");
    }

    const user = await Users.findOne({ email });

    if (!user) {
      return res.status(400).send("User email or password is incorrect");
    }

    const validateUser = await bcryptjs.compare(password, user.password);

    if (!validateUser) {
      return res.status(400).send("User email or password is incorrect");
    }

    const payload = {
      userId: user._id,
      email: user.email,
    };

    const JWTkey = "superman@123";
    jwt.sign(payload, JWTkey, { expiresIn: 84600 }, async (err, token) => {
      if (err) {
        return res.status(500).send("Internal Server Error");
      }

      await Users.updateOne({ _id: user._id }, { $set: { token } });

      user.token = token;
      await user.save();

      res.status(200).json({
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          images: user.images,
        },
        token: token,
      });
    });
  } catch (error) {
    return res.status(500).send("Internal Server Error");
  }
});

router.post(
  "/users/update/:userId",
  upload.single("image"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { fullName } = req.body;
      const image = req.file; // The uploaded file

      // Validate required fields
      if (!fullName) {
        return res.status(400).send("Please enter all fields");
      }

      // Construct the image path if a file was uploaded
      let imagePath;
      if (image) {
        imagePath = `/uploads/${image.filename}`; // Path to be stored in the database
      }

      // Update the user with the new fullName and image path
      const updateData = { fullName };
      if (imagePath) {
        updateData.images = imagePath;
      }

      const updatedUser = await Users.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedUser) {
        return res.status(404).send("User not found");
      }

      const response = {
        fullName: updatedUser.fullName,
        images: updatedUser.images,
        id: updatedUser._id,
        email: updatedUser.email,
      };

      res
        .status(200)
        .json({ message: "User updated successfully", updatedUser: response });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to update user. Please try again later." });
    }
  }
);

router.get("/users/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const users = await Users.find({ _id: { $ne: userId } });
    const Userdata = Promise.all(
      users.map(async (user) => {
        return {
          user: {
            email: user.email,
            fullName: user.fullName,
            images: user.images,
            recieverId: user._id,
          },
        };
      })
    );
    res.status(200).json(await Userdata);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve users. Please try again later." });
  }
});

module.exports = router;
