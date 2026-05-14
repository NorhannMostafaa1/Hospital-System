const AuditLog = require('../models/AuditLog');

const logAction = async ({ actor, action, entityType, entityId, previousState, newState, metadata, req, session }) => {
  return AuditLog.create(
    [
      {
        actor,
        action,
        entityType,
        entityId,
        previousState,
        newState,
        metadata,
        ip: req?.ip,
        userAgent: req?.headers?.['user-agent'],
      },
    ],
    { session }
  );
};

module.exports = { logAction };
