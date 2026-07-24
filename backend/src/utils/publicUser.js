const { getPermissionsForRole } = require("../config/permissions");

function publicUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenant_id: user.tenant_id,
    tenant: user.tenant_id ? {
      id: user.tenant_id,
      name: user.tenant_name || null,
      slug: user.tenant_slug || null
    } : null,
    auth_provider: user.auth_provider || "local",
    permissions: getPermissionsForRole(user.role),
    status: user.status,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

module.exports = {
  publicUser
};
