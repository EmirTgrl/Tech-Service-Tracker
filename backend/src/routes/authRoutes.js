const express = require("express");
const {
  registerUser,
  loginUser,
  updateMyProfile,
  updateMyPassword,
} = require("../controllers/authController");
const { protect, authorize } = require("../middleware.js");

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.put("/profile", protect, updateMyProfile);

router.put("/password", protect, updateMyPassword);

module.exports = router;
