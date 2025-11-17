const prisma = require("../db");

const getAuditLogs = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;
  const take = limitNum;

  try {
    const [logs, totalCount] = await prisma.$transaction([
      prisma.auditLog.findMany({
        skip,
        take,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          actor: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.auditLog.count(),
    ]);

    const totalPages = Math.ceil(totalCount / take);

    res.json({
      data: logs,
      pagination: {
        totalItems: totalCount,
        totalPages: totalPages,
        currentPage: pageNum,
        itemsPerPage: take,
      },
    });
  } catch (error) {
    console.error("An error occurred while retrieving the audit logs:", error);
    res.status(500).json({ error: "Server error." });
  }
};

module.exports = {
  getAuditLogs,
};
