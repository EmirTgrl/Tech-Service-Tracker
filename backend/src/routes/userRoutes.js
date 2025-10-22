const express = require("express");
const {
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware");

const router = express.Router();

router.use(protect, authorize(["ADMIN"]));

router.get("/", getAllUsers);

router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deactivateUser);

module.exports = router;
