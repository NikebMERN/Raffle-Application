const { createRepo } = require('./baseRepo');

const repo = createRepo('auditLogs');

// Fire-and-forget audit logging: never let an audit write break the main flow.
async function record(entry) {
  try {
    return await repo.create(entry);
  } catch {
    return null;
  }
}

module.exports = { ...repo, record };
