const express = require("express");
const {
  createDevice,
  getAllDevices,
  getDeviceById,
  getDeviceStatusByTrackingCode,
  updateDevice,
  updateDeviceStatus,
  addRepairRecord,
} = require("../controllers/deviceController");
const { protect, authorize } = require("../middleware");

const router = express.Router();

router.get("/track", getDeviceStatusByTrackingCode);

router.post("/", protect, authorize(["ADMIN", "TECHNICIAN"]), createDevice);

router.get("/", protect, authorize(["ADMIN", "TECHNICIAN"]), getAllDevices);

router.get("/:id", protect, authorize(["ADMIN", "TECHNICIAN"]), getDeviceById);

router.put("/:id", protect, authorize(["ADMIN", "TECHNICIAN"]), updateDevice);

router.put(
  "/:id/status",
  protect,
  authorize(["ADMIN", "TECHNICIAN"]),
  updateDeviceStatus
);

router.post(
  "/:id/repair",
  protect,
  authorize(["ADMIN", "TECHNICIAN"]),
  addRepairRecord
);

module.exports = router;
