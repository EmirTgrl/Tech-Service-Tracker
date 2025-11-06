const prisma = require("../db");
const fs = require("fs");
const path = require("path");
const { generateTrackingCode } = require("../utils/codeGenerator");
const { sendEmail } = require("../utils/sendEmail");

const sendNotificationEmail = async (deviceId, newStatus) => {
  if (newStatus !== "COMPLETED" && newStatus !== "IN_REPAIR") {
    return;
  }

  try {
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        customer: { select: { name: true, email: true } },
      },
    });

    if (!device || !device.customer.email) {
      console.log(
        `Email could not be sent: Device (ID: ${deviceId}) or customer email address could not be found.`
      );
      return;
    }

    let subject = "";
    let htmlBody = "";

    if (newStatus === "COMPLETED") {
      subject = `Your device is ready! (Tracking Code: ${device.trackingCode})`;
      htmlBody = `
                <p>Hello ${device.customer.name},</p>
                <p><b>${device.brand} ${device.model}</b> model (${
        device.trackingCode
      }) the repair of your device has been completed.</p>
                <p>You can take your device from our service centre.</p>
                <p>Total Cost: <b>${
                  device.finalCost ? device.finalCost.toFixed(2) : "0.00"
                } TL</b></p>
                <br>
                <p>We wish you a good day,<br>Technical Support Team</p>
            `;
    } else if (newStatus === "IN_REPAIR") {
      subject = `Your device has been taken in for repair. (Tracking Code: ${device.trackingCode})`;
      htmlBody = `
                <p>Hello ${device.customer.name},</p>
                <p><b>${device.brand} ${device.model}</b> model (${
        device.trackingCode
      }) your device has been examined and is now undergoing repair.</p>
                <p>Estimated Cost: <b>${
                  device.estimatedCost
                    ? device.estimatedCost.toFixed(2)
                    : "Not specified"
                } TL</b></p>
                <br>
                <p>We wish you a good day,<br>Technical Support Team</p>
            `;
    }

    await sendEmail(device.customer.email, subject, htmlBody);
  } catch (error) {
    console.error(
      `An error occurred while sending the email notification (Device ID: ${deviceId}):`,
      error
    );
  }
};

const createDevice = async (req, res) => {
  const {
    customerName,
    customerPhone,
    customerEmail,
    deviceType,
    brand,
    model,
    serialNo,
    issueDesc,
    estimatedCost,
  } = req.body;

  if (
    !customerName ||
    !customerPhone ||
    !deviceType ||
    !brand ||
    !serialNo ||
    !issueDesc
  ) {
    return res.status(400).json({
      error:
        "Customer name, telephone number and basic device informations (type, brand, serial number, problem) are missing.",
    });
  }

  try {
    let customer = await prisma.customer.findUnique({
      where: { phone: customerPhone },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
        },
      });
    }

    const trackingCode = await generateTrackingCode();

    const newDevice = await prisma.device.create({
      data: {
        customerId: customer.id,
        deviceType,
        brand,
        model,
        serialNo,
        issueDesc,
        trackingCode,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,

        technicianId: req.user.id,

        statusHistory: {
          create: {
            newStatus: "PENDING",
            notes: "Service record created.",
            userId: req.user.id,
          },
        },
      },
      include: {
        customer: true,
        statusHistory: true,
      },
    });

    res.status(201).json({
      message: "Service record created successfully.",
      device: newDevice,
      trackingCode: newDevice.trackingCode,
    });
  } catch (error) {
    if (error.code === "P2002" && error.meta.target.includes("serialNo")) {
      return res.status(409).json({
        error: `The serial number (${serialNo}) is already registered in the system..`,
      });
    }
    console.error("Error creating device:", error);
    res.status(500).json({
      error:
        "An error occurred while creating the service record. Please try again later.",
    });
  }
};

const getAllDevices = async (req, res) => {
  const {
    status,
    search,
    technicianId,
    startDate,
    endDate,
    page = 1,
    limit = 10,
  } = req.query;

  const where = {};
  const conditions = [];

  if (status) {
    const upperStatus = status.toUpperCase();
    where.currentStatus = upperStatus;
  }

  if (technicianId) {
    where.technicianId = parseInt(technicianId);
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      where.createdAt.lte = end;
    }
  }

  if (search) {
    conditions.push({
      OR: [
        { customer: { name: { contains: search } } },
        { serialNo: { contains: search } },
        { model: { contains: search } },
        { trackingCode: { contains: search } },
      ],
    });
  }
  if (conditions.length > 0) {
    where.AND = conditions;
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;
  const take = limitNum;

  try {
    const [devices, totalCount] = await prisma.$transaction([
      prisma.device.findMany({
        where: where,
        include: {
          customer: { select: { name: true, phone: true } },
          assignedTechnician: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: skip,
        take: take,
      }),

      prisma.device.count({
        where: where,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / take);

    res.json({
      data: devices,
      pagination: {
        totalItems: totalCount,
        totalPages: totalPages,
        currentPage: pageNum,
        itemsPerPage: take,
      },
    });
  } catch (error) {
    console.error("Error fetching devices:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching devices." });
  }
};

const getDeviceById = async (req, res) => {
  const { id } = req.params;

  try {
    const device = await prisma.device.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        assignedTechnician: {
          select: { name: true, email: true },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true } } },
        },
        repairs: true,
        images: true,
        partsUsed: {
          include: {
            inventoryItem: {
              select: { name: true, sku: true },
            },
          },
        },
      },
    });

    if (!device) {
      return res.status(404).json({ error: "Device record not found" });
    }
    res.json(device);
  } catch (error) {
    console.error("Error fetching device by ID:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the device record." });
  }
};

const getDeviceStatusByTrackingCode = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(404).json({ error: "Tracking code is required" });
  }

  try {
    const device = await prisma.device.findUnique({
      where: {
        trackingCode: code.toUpperCase(),
      },
      select: {
        trackingCode: true,
        currentStatus: true,
        issueDesc: true,
        createdAt: true,
        estimatedCost: true,

        customer: {
          select: { name: true, phone: true },
        },

        statusHistory: {
          orderBy: { createdAt: "desc" },
          select: {
            newStatus: true,
            notes: true,
            createdAt: true,
          },
        },

        repairs: {
          select: { cost: true },
        },
      },
    });

    if (!device) {
      return res
        .status(404)
        .json({ error: "No device found with the provided tracking code." });
    }

    res.json(device);
  } catch (error) {
    console.error("Customer enquiry error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const updateDevice = async (req, res) => {
  const { id } = req.params;
  const { deviceType, brand, model, serialNo, issueDesc, estimatedCost } =
    req.body;

  const updateData = {};
  if (deviceType) updateData.deviceType = deviceType;
  if (brand) updateData.brand = brand;
  if (model) updateData.model = model;
  if (serialNo) updateData.serialNo = serialNo;
  if (issueDesc) updateData.issueDesc = issueDesc;
  if (estimatedCost !== undefined && estimatedCost !== null) {
    updateData.estimatedCost = parseFloat(estimatedCost);
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: "No data to update was found" });
  }

  try {
    const updatedDevice = await prisma.device.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        customer: true,
        assignedTechnician: {
          select: { name: true, email: true },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true } } },
        },
        repairs: true,
        images: true,
      },
    });

    res.json({
      message: "Device record updated successfully",
      device: updatedDevice,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Device record not found" });
    }
    if (error.code === "P2002" && error.meta.target.includes("serialNo")) {
      return res.status(409).json({
        error: `The serial number (${serialNo}) is already registered in the system.`,
      });
    }
    console.error("Error updating device:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the device record." });
  }
};

const updateDeviceStatus = async (req, res) => {
  const { id } = req.params;
  const { newStatus, notes } = req.body;

  if (!newStatus) {
    return res.status(400).json({ error: "New status is required" });
  }

  const upperStatus = newStatus.toUpperCase();

  try {
    const [updatedDevice, newLog] = await prisma.$transaction([
      prisma.device.update({
        where: { id: parseInt(id) },
        data: {
          currentStatus: upperStatus,
          technicianId: upperStatus === "DELIVERED" ? null : undefined,
        },
        select: { id: true, currentStatus: true, trackingCode: true },
      }),

      prisma.statusLog.create({
        data: {
          deviceId: parseInt(id),
          newStatus: upperStatus,
          notes: notes || `Status changed to ${upperStatus}`,
          userId: req.user.id,
        },
        include: {
          user: {
            select: { name: true },
          },
        },
      }),
    ]);

    sendNotificationEmail(deviceId, upperStatus);

    res.json({
      message: `Device status updated to ${upperStatus} successfully.`,
      device: updatedDevice,
      log: newLog,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ error: `The device with ID ${id} was not found.` });
    }
    if (error.code === "P2007") {
      return res.status(400).json({ error: "Invalid status value provided." });
    }
    console.error("Error updating device status:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the device status." });
  }
};

const addRepairRecord = async (req, res) => {
  const { id } = req.params;
  const { description, cost } = req.body;
  const deviceId = parseInt(id);

  if (!description || cost === undefined || cost === null) {
    return res
      .status(400)
      .json({ error: "Explanation (repair) and cost are required." });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const newRepair = await tx.repair.create({
        data: {
          deviceId: deviceId,
          description,
          cost: parseFloat(cost),
        },
      });

      const partCosts = await tx.partUsage.aggregate({
        _sum: { sellPriceAtTimeOfUse: true },
        where: { deviceId: deviceId },
      });
      const totalPartCost = partCosts._sum.sellPriceAtTimeOfUse || 0;

      const repairCosts = await tx.repair.aggregate({
        _sum: { cost: true },
        where: { deviceId: deviceId },
      });
      const totalRepairCost = repairCosts._sum.cost || 0;

      const newFinalCost = totalPartCost + totalRepairCost;
      await tx.device.update({
        where: { id: deviceId },
        data: {
          finalCost: newFinalCost,
        },
      });

      return { newRepair, newFinalCost };
    });

    res.status(201).json({
      message: "Repair record successfully added.",
      repair: result.newRepair,
      newFinalCost: result.newFinalCost,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ error: `The device with ID ${id} was not found.` });
    }
    console.error("Repair record adding error:", error);
    res.status(500).json({ error: "Server error." });
  }
};

const uploadDeviceImage = async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;

  if (!req.file) {
    return res
      .status(400)
      .json({ error: "Please select an image file to upload." });
  }

  try {
    const deviceId = parseInt(id);

    const deviceExists = await prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!deviceExists) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "No device found to add image." });
    }

    const filename = req.file.filename;

    const imageUrl = `/public/uploads/${filename}`;

    const newImage = await prisma.deviceImage.create({
      data: {
        deviceId: deviceId,
        imageUrl: imageUrl,
        description: description || null,
      },
    });

    res.status(201).json({
      message:
        "The image has been successfully uploaded and added to the device..",
      image: newImage,
    });
  } catch (error) {
    console.error("Image upload or database record error:", error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (error.code === "P2025") {
      return res.status(404).json({ error: "No related device record found." });
    }

    res
      .status(500)
      .json({ error: "Server error. Image could not be uploaded." });
  }
};

const useInventoryPart = async (req, res) => {
  const { id } = req.params;
  const { inventoryItemId, quantityUsed } = req.body;
  const deviceId = parseInt(id);

  if (!inventoryItemId || !quantityUsed || parseInt(quantityUsed) <= 0) {
    return res.status(400).json({
      error:
        "Part ID (inventoryItemId) and quantity greater than 0 (quantityUsed) are required.",
    });
  }

  const quantityToUse = parseInt(quantityUsed);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: parseInt(inventoryItemId) },
      });

      if (!item) {
        throw new Error("Such a part could not be found in stock.");
      }

      if (item.quantity < quantityToUse) {
        throw new Error(
          `There are insufficient quantities in stock. Remaining: ${item.quantity}`
        );
      }

      await tx.inventoryItem.update({
        where: { id: parseInt(inventoryItemId) },
        data: {
          quantity: {
            decrement: quantityToUse,
          },
        },
      });

      const newPartUsage = await tx.partUsage.create({
        data: {
          deviceId: deviceId,
          inventoryItemId: parseInt(inventoryItemId),
          quantityUsed: quantityToUse,
          sellPriceAtTimeOfUse: item.sellPrice,
        },
        include: {
          inventoryItem: {
            select: { name: true, sku: true },
          },
        },
      });

      const partCosts = await tx.partUsage.aggregate({
        _sum: {
          sellPriceAtTimeOfUse: true,
        },
        where: { deviceId: deviceId },
      });
      const totalPartCost = partCosts._sum.sellPriceAtTimeOfUse || 0;

      const repairCosts = await tx.repair.aggregate({
        _sum: {
          cost: true,
        },
        where: { deviceId: deviceId },
      });
      const totalRepairCost = repairCosts._sum.cost | 0;

      const newFinalCost = totalPartCost + totalRepairCost;
      await tx.device.update({
        where: { id: deviceId },
        data: {
          finalCost: newFinalCost,
        },
      });

      return { newPartUsage, newFinalCost };
    });

    res.status(201).json({
      message: "The part was successfully used and the stock was updated.",
      partUsage: result.newPartUsage,
      newFinalCost: result.newFinalCost,
    });
  } catch (error) {
    console.error("Part using error", error);
    if (
      error.message.includes("There are insufficient quantities in stock.") ||
      error.message.includes("Such a part could not be found in stock.")
    ) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Server error." });
  }
};

module.exports = {
  createDevice,
  getAllDevices,
  getDeviceById,
  getDeviceStatusByTrackingCode,
  updateDevice,
  updateDeviceStatus,
  addRepairRecord,
  uploadDeviceImage,
  useInventoryPart,
};
