async function writeAuditEvent(pool, options) {
  await pool.query(
    `
    INSERT INTO audit_events (
      tenant_id,
      actor_user_id,
      action,
      entity_type,
      entity_id,
      metadata
    )
    VALUES (
      COALESCE(
        $1,
        (SELECT tenant_id FROM users WHERE id = $2),
        '00000000-0000-4000-8000-000000000001'
      ),
      $2, $3, $4, $5, $6
    )
    `,
    [
      options.tenantId || null,
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
