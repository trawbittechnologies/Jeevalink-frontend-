export const ROLE_HIERARCHY = {
  technical_admin: {
    manages: 'super_admin',
    label: 'Technical Admin',
    managesLabel: 'Super Admins',
  },
  super_admin: {
    manages: 'admin',
    label: 'Super Admin',
    managesLabel: 'Block Committee Admins',
  },
  admin: {
    manages: 'volunteer',
    label: 'Block Committee Admin',
    managesLabel: 'Meghala Committee Volunteers',
  },
  volunteer: {
    manages: null,
    label: 'Meghala Committee Volunteer',
    managesLabel: null,
  },
};

/**
 * Check if a given actor role can manage a target role.
 */
export const canManage = (actorRole, targetRole) => {
  if (!ROLE_HIERARCHY[actorRole]) return false;
  return ROLE_HIERARCHY[actorRole].manages === targetRole;
};

/**
 * Get the target role that this actor is allowed to manage.
 */
export const getManagedRole = (actorRole) => {
  return ROLE_HIERARCHY[actorRole]?.manages || null;
};

/**
 * Get human-readable label for a role.
 */
export const getRoleLabel = (role) => {
  return ROLE_HIERARCHY[role]?.label || role;
};
