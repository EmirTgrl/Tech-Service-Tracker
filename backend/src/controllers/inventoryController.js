const prisma = require("../db");
const { logActivity } = require('../utils/logger');

const createInventoryItem = async (req, res) => {
  const { name, sku, description, quantity, buyPrice, sellPrice } = req.body;

  if (!name || !sku || !sellPrice) {
    return res.status(400).json({
      error: "Part name, Stock Code (SKU) and Sales Price are mandatory.",
    });
  }

  try {
    const newItem = await prisma.inventoryItem.create({
      data: {
        name,
        sku,
        description,
        quantity: parseInt(quantity) || 0,
        buyPrice: buyPrice ? parseFloat(buyPrice) : null,
        sellPrice: parseFloat(sellPrice),
      },
    });

    logActivity(req.user.id, "INVENTORY_CREATE", "InventoryItem", newItem.id, {
      name: newItem.name,
      sku: newItem.sku,
      quantity: newItem.quantity,
    });
    res.status(201).json(newItem);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        error: `This Stock Keeping Unit (SKU: ${sku}) is already in use.`,
      });
    }
    console.error("Error creating stock item:", error);
    res.status(500).json({ error: "Server error." });
  }
};

const getAllInventoryItems = async (req, res) => {
  const { search } = req.query;

  const where = {};
  if (search) {
    where.OR = [{ name: { contains: search } }, { sku: { contains: search } }];
  }

  try {
    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { name: "asc" },
    });
    res.json(items);
  } catch (error) {
    console.error("Stock inventory listing error", error);
    res.status(500).json({ error: "Server error." });
  }
};

const getInventoryItemById = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: parseInt(id) },
    });
    if (!item) {
      return res.status(404).json({ error: "Stock item not found" });
    }
    res.json(item);
  } catch (error) {
    console.error("Stock detail error", error);
    res.status(500).json({ error: "Server error." });
  }
};

const updateInventoryItem = async (req, res) => {
  const { id } = req.params;
  const { name, sku, description, quantity, buyPrice, sellPrice } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (sku) updateData.sku = sku;
  if (description) updateData.description = description;
  if (quantity !== undefined) updateData.quantity = parseInt(quantity);
  if (buyPrice !== undefined) updateData.buyPrice = parseFloat(buyPrice);
  if (sellPrice !== undefined) updateData.sellPrice = parseFloat(sellPrice);

  try {
    const updatedItem = await prisma.inventoryItem.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    logActivity(
      req.user.id,
      "INVENTORY_UPDATE",
      "InventoryItem",
      updatedItem.id,
      { updatedFields: Object.keys(updateData) }
    );

    res.json(updatedItem);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "No item to update was found." });
    }
    if (error.code === "P2002") {
      return res.status(409).json({
        error: `This Stock Keeping Unit (SKU) already belongs to another item.`,
      });
    }
    console.error("Stock update error:", error);
    res.status(500).json({ error: "Server error." });
  }
};

const deleteInventoryItem = async (req, res) => {
  const { id } = req.params;
  try {
    const itemToDelete = await prisma.inventoryItem.findUnique({
      where: { id: parseInt(id) },
      select: { name: true, sku: true },
    });

    if (!itemToDelete) {
      return res.status(404).json({ error: "No item to be deleted found." });
    }

    await prisma.inventoryItem.delete({
      where: { id: parseInt(id) },
    });

    logActivity(
      req.user.id,
      "INVENTORY_DELETE",
      "InventoryItem",
      parseInt(id),
      { deletedName: itemToDelete.name, deletedSku: itemToDelete.sku }
    );

    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "No item to delete was found." });
    }
    if (error.code === "P2003") {
      return res.status(400).json({
        error:
          "This part cannot be deleted as it has been used in previous repairs. (You can set the stock quantity to 0.)",
      });
    }
    console.error("Stock delete error:", error);
    res.status(500).json({ error: "Server error." });
  }
};

module.exports = {
  createInventoryItem,
  getAllInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
};
