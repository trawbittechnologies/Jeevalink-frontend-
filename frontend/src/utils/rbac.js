export const ROLES = {
  TECHNICAL_ADMIN: 'technical_admin',
  SUPER_ADMIN: 'super_admin',
  BLOCK_ADMIN: 'block_admin',
  VOLUNTEER: 'volunteer',
  UNIT_SQUAD: 'unit_squad',
  USER: 'user',
};

export const normalizeRole = (role) => {
  if (!role || typeof role !== 'string') return ROLES.USER;
  const cleaned = role.trim().toLowerCase().replace(/[\s\-_]+/g, '_');
  if (cleaned === 'technical_admin' || cleaned === 'technicaladmin' || cleaned === 'tech_admin') {
    return ROLES.TECHNICAL_ADMIN;
  }
  if (cleaned === 'super_admin' || cleaned === 'superadmin') {
    return ROLES.SUPER_ADMIN;
  }
  if (cleaned === 'block_admin' || cleaned === 'blockadmin' || cleaned === 'admin' || cleaned === 'administrator') {
    return ROLES.BLOCK_ADMIN;
  }
  if (cleaned === 'volunteer') {
    return ROLES.VOLUNTEER;
  }
  if (cleaned === 'unit_squad' || cleaned === 'unitsquad') {
    return ROLES.UNIT_SQUAD;
  }
  return ROLES.USER;
};

export const ROLE_HIERARCHY = {
  [ROLES.TECHNICAL_ADMIN]: {
    manages: ROLES.SUPER_ADMIN,
    label: 'Technical Admin',
    managesLabel: 'Super Admins',
    level: 1,
  },
  [ROLES.SUPER_ADMIN]: {
    manages: ROLES.BLOCK_ADMIN,
    label: 'Super Admin',
    managesLabel: 'Block Committee Admins',
    level: 2,
  },
  [ROLES.BLOCK_ADMIN]: {
    manages: ROLES.VOLUNTEER,
    label: 'Block Committee Admin',
    managesLabel: 'Meghala Committee Volunteers',
    level: 3,
  },
  [ROLES.VOLUNTEER]: {
    manages: ROLES.UNIT_SQUAD,
    label: 'Meghala Committee Volunteer',
    managesLabel: 'Unit Squad Volunteers',
    level: 4,
  },
  [ROLES.UNIT_SQUAD]: {
    manages: ROLES.USER,
    label: 'Unit Squad Member',
    managesLabel: 'Donors & Users',
    level: 5,
  },
  [ROLES.USER]: {
    manages: null,
    label: 'Donor / User',
    managesLabel: null,
    level: 6,
  },
};

/**
 * Check if a given actor role can manage a target role.
 */
export const canManage = (actorRole, targetRole) => {
  const normActor = normalizeRole(actorRole);
  const normTarget = normalizeRole(targetRole);
  if (!ROLE_HIERARCHY[normActor]) return false;
  return ROLE_HIERARCHY[normActor].manages === normTarget;
};

/**
 * Get the target role that this actor is allowed to manage.
 */
export const getManagedRole = (actorRole) => {
  const normActor = normalizeRole(actorRole);
  return ROLE_HIERARCHY[normActor]?.manages || null;
};

/**
 * Get human-readable label for a role.
 */
export const getRoleLabel = (role) => {
  const normRole = normalizeRole(role);
  return ROLE_HIERARCHY[normRole]?.label || role;
};
