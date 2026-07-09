async function writeAuditEvent(pool, options) {
  await pool.query(
    `
    INSERT INTO audit_events (
      actor_user_id,
      action,
      entity_type,
      entity_id,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5)
    `,
    [
      options.actorUserId,
      options.action,
      options.entityType,
      options.entityId,
      JSON.stringify(options.metadata || {})
    ]
  );
}

module.exports = {
  writeAuditEvent
};
