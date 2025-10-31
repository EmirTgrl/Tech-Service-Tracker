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

module.exports = { getDashboardStats };
