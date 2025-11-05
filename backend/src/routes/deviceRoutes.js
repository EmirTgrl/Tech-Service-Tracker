const express = require("express");
const {
  createDevice,
  getAllDevices,
  getDeviceById,
  getDeviceStatusByTrackingCode,
  updateDevice,
  updateDeviceStatus,
  addRepairRecord,
  uploadDeviceImage,
  useInventoryPart,
} = require("../controllers/deviceController");
const { uploadSingleImage } = require("../middleware/upload.js");
const { protect, authorize } = require("../middleware.js");

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

router.post(
  "/:id/upload",
  protect,
  authorize(["ADMIN", "TECHNICIAN"]),
  uploadSingleImage,
  uploadDeviceImage
);

router.post(
  "/:id/use-part",
  protect,
  authorize(["ADMIN", "TECHNICIAN"]),
  useInventoryPart
);

module.exports = router;
