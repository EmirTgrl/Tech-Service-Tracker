const prisma = require("../db");

const logActivity = (actorId, action, entityType, entityId, details = null) => {
  prisma.auditLog
    .create({
      data: {
        actorId: actorId,
        action: action,
        entityType: entityType,
        entityId: entityId,
        details: details || undefined,
      },
    })
    .catch((error) => {
      console.error("Failed to write log activity:", error);
    });
};

module.exports = {
  logActivity,
};
