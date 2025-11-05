const express = require("express");
const {
  createInventoryItem,
  getAllInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
} = require("../controllers/inventoryController");
const { protect, authorize } = require("../middleware.js");

const router = express.Router();

router.get(
  "/",
  protect,
  authorize(["ADMIN", "TECHNICIAN"]),
  getAllInventoryItems
);

router.get(
  "/:id",
  protect,
  authorize(["ADMIN", "TECHNICIAN"]),
  getInventoryItemById
);

router.post("/", protect, authorize(["ADMIN"]), createInventoryItem);

router.put("/:id", protect, authorize(["ADMIN"]), updateInventoryItem);

router.delete("/:id", protect, authorize(["ADMIN"]), deleteInventoryItem);

module.exports = router;
