const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true },
    entity: String,
    entityId: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    suspicious: { type: Boolean, default: false },
  },
  { timestamps: true },
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
