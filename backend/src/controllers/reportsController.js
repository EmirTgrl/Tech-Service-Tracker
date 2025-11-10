const prisma = require("../db");

const getTechnicianPerformance = async (req, res) => {
  try {
    const performanceData = await prisma.device.groupBy({
      by: ["technicianId"],
      _count: {
        id: true,
      },
      where: {
        currentStatus: { in: ["COMPLETED", "DELIVERED"] },
        technicianId: { not: null },
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    const technicianIds = performanceData.map((item) => item.technicianId);

    const technicians = await prisma.user.findMany({
      where: {
        id: { in: technicianIds },
      },
      select: { id: true, name: true },
    });

    const techNameMap = new Map(technicians.map((t) => [t.id, t.name]));

    const chartData = performanceData.map((item) => ({
      name: techNameMap.get(item.technicianId) || "Unknown Technician",
      count: item._count.id,
    }));

    res.json(chartData);
  } catch (error) {
    console.error("Technician performance report error:", error);
    res
      .status(500)
      .json({ error: "An error occurred while generating the report." });
  }
};

const getMostRepairedBrands = async (req, res) => {
  try {
    const brandData = await prisma.device.groupBy({
      by: ["brand"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10,
    });

    const chartData = brandData.map((item) => ({
      name: item.brand,
      count: item._count.id,
    }));

    res.json(chartData);
  } catch (error) {
    console.error("Brand report error:", error);
    res
      .status(500)
      .json({ error: "An error occurred while generating the report." });
  }
};

module.exports = {
  getTechnicianPerformance,
  getMostRepairedBrands,
};
