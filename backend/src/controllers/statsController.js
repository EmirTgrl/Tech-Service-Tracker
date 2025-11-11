const prisma = require("../db");

const getDashboardStats = async (req, res) => {
  try {
    const deviceCounts = await prisma.device.groupBy({
      by: ["currentStatus"],
      _count: {
        id: true,
      },
    });

    const totalCustomers = await prisma.customer.count();

    const formattedDeviceStats = {
      PENDING: 0,
      IN_REPAIR: 0,
      COMPLETED: 0,
      DELIVERED: 0,
    };

    deviceCounts.forEach((group) => {
      formattedDeviceStats[group.currentStatus] = group._count.id;
    });

    res.json({
      deviceStats: formattedDeviceStats,
      totalCustomers: totalCustomers,
    });
  } catch (error) {
    console.error("Statistic retrieval error:", error);
    res
      .status(500)
      .json({ error: "A server error occurred while loading statistics." });
  }
};

const getFullDashboardData = async (req, res) => {
  const { role: userRole, id: userId } = req.user;

  try {
    const deviceCounts = await prisma.device.groupBy({
      by: ["currentStatus"],
      _count: { id: true },
    });
    const totalCustomers = await prisma.customer.count();

    const formattedDeviceStats = {
      PENDING: 0,
      IN_REPAIR: 0,
      COMPLETED: 0,
      DELIVERED: 0,
    };
    deviceCounts.forEach((group) => {
      formattedDeviceStats[group.currentStatus] = group._count.id;
    });

    let recentActivity = [];
    let unassignedDevices = [];

    if (userRole === "ADMIN") {
      unassignedDevices = await prisma.device.findMany({
        where: {
          technicianId: null,
          currentStatus: { in: ["PENDING", "IN_REPAIR"] },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { name: true } } },
      });
    }

    if (userRole === "TECHNICIAN") {
      recentActivity = await prisma.device.findMany({
        where: {
          technicianId: userId,
          currentStatus: { in: ["PENDING", "IN_REPAIR"] },
        },
        take: 5,
        orderBy: { updatedAt: "desc" },
        include: { customer: { select: { name: true } } },
      });
    }

    res.json({
      stats: {
        deviceStats: formattedDeviceStats,
        totalCustomers: totalCustomers,
      },
      lists: {
        unassignedDevices,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Full Dashboard data retrieval error:", error);
    res
      .status(500)
      .json({ error: "An error occurred while loading dashboard data." });
  }
};

module.exports = { getDashboardStats, getFullDashboardData };
