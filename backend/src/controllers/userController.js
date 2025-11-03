const prisma = require("../db");
const bcrypt = require("bcryptjs");

const getAllUsers = async (req, res) => {
  const { includeInactive } = req.query;

  const where = {
    isActive: includeInactive === "true" ? undefined : true,
  };

  try {
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Server error." });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({ error: "Server error." });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, role, password } = req.body;
  const updateData = {};

  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (role) updateData.role = role;

  if (password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(password, salt);
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: "No valid fields to update." });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json({ message: "User updated successfully.", user: updatedUser });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ error: `User with ID ${id} could not be found.` });
    }
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Server error." });
  }
};

const deactivateUser = async (req, res) => {
  const { id } = req.params;
  try {
    const deactivatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
      select: { id: true, name: true, isActive: true },
    });

    res.json({
      message: `User with (${deactivatedUser.name}) has been deactivated`,
      user: deactivatedUser,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ error: `User with ID ${id} could not be found.` });
    }
    console.error("Error deactivating user:", error);
    res.status(500).json({ error: "Server error." });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
};
