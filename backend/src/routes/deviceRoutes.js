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
  assignTechnician,
  markDeviceAsPaid,
} = require("../controllers/deviceController");
const { uploadSingleImage } = require("../middleware/upload.js");
const { protect, authorize, checkDeviceAccess } = require("../middleware.js");

const router = express.Router();

router.get("/track", getDeviceStatusByTrackingCode);

router.post("/", protect, authorize(["ADMIN", "TECHNICIAN"]), createDevice);

router.get("/", protect, authorize(["ADMIN", "TECHNICIAN"]), getAllDevices);

router.put("/:id/assign", protect, authorize(["ADMIN"]), assignTechnician);

router.get("/:id", protect, checkDeviceAccess, getDeviceById);

router.put("/:id", protect, checkDeviceAccess, updateDevice);

router.put("/:id/status", protect, checkDeviceAccess, updateDeviceStatus);

router.post("/:id/repair", protect, checkDeviceAccess, addRepairRecord);

router.post("/:id/use-part", protect, checkDeviceAccess, useInventoryPart);

router.put("/:id/mark-as-paid", protect, checkDeviceAccess, markDeviceAsPaid);

router.post(
  "/:id/upload",
  protect,
  checkDeviceAccess,
  uploadSingleImage,
  uploadDeviceImage
);

module.exports = router;
