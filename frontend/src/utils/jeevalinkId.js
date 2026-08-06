/**
 * JeevaLink ID Utility
 * Provides consistent JL-ROLE-DISTRICT-RANDOM ID generation & display.
 *
 * Format:
 *   Technical Admin  → JL-TA-XXXX
 *   All other roles  → JL-{ROLE}-{DISTRICT}-XXXX
 *
 * XXXX = deterministic 4-digit number derived from the user's DB id
 *        (so the same user always gets the same fallback string while
 *         the real jeevalink_id hasn't loaded yet).
 */

export const DISTRICT_CODES = {
  kasaragod:          'KSD',
  kannur:             'KNR',
  wayanad:            'WYD',
  kozhikode:          'KKD',
  malappuram:         'MLP',
  palakkad:           'PKD',
  thrissur:           'TSR',
  ernakulam:          'EKM',
  idukki:             'IDK',
  kottayam:           'KTM',
  alappuzha:          'ALP',
  pathanamthitta:     'PTA',
  kollam:             'KLM',
  thiruvananthapuram: 'TVM',
};

export const ROLE_CODES = {
  technical_admin: 'TA',
  super_admin:     'SA',
  admin:           'AD',
  block_admin:     'BA',
  volunteer:       'VO',
  unit_squad:      'US',
  user:            'UR',
};

/**
 * Derive a district code from a district name string.
 * Falls back to the first 3 uppercase letters of the name, or 'GEN'.
 */
export function getDistrictCode(district = '') {
  const key = district.toLowerCase().trim();
  return DISTRICT_CODES[key] || (district.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3) || 'GEN');
}

/**
 * Get a 2-letter role code.
 */
export function getRoleCode(role = '') {
  return ROLE_CODES[role.toLowerCase().trim()] || 'UR';
}

/**
 * Generate a deterministic 4-digit random-looking number from a numeric id.
 * Same id → same suffix every time (stable fallback display).
 */
function deterministicSuffix(id) {
  const n = parseInt(id, 10) || 1;
  return String((n * 7 + 1337) % 9000 + 1000).padStart(4, '0');
}

/**
 * Build a fallback JL ID when the real one isn't available from the server yet.
 *
 * @param {object} user  - user object with optional: id, _id, role, district
 * @returns {string|null}
 */
export function buildFallbackJeevalinkId(user) {
  if (!user) return null;
  const id = user.id || user._id;
  if (!id) return null;

  const roleCode = getRoleCode(user.role || '');
  const suffix   = deterministicSuffix(id);

  if (roleCode === 'TA') {
    return 'JL-TA-' + suffix;
  }

  const districtCode = getDistrictCode(user.district || user.city || '');
  return 'JL-' + roleCode + '-' + districtCode + '-' + suffix;
}

/**
 * Get the displayable JeevaLink ID for a user object.
 * Prefers the real server-assigned id; falls back to generated one.
 *
 * @param {object} user
 * @returns {string|null}
 */
export function getDisplayJeevalinkId(user) {
  if (!user) return null;
  return (
    user.jeevalink_id ||
    user.employee_id  ||
    user.jeevalinkId  ||
    user.employeeId   ||
    buildFallbackJeevalinkId(user)
  );
}
