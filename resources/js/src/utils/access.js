export const ROLE_LABELS = {
  1: 'Super Admin',
  2: 'Admin',
  3: 'Data Entry',
  4: 'Verifier',
  5: 'Booth Officer',
  6: 'Report Viewer'
};

export function hasPermission(user, permission) {
  if (!permission) return true;
  if (Number(user?.role) === 1 || user?.access?.is_super_admin) return true;

  if (permission.includes('.')) {
    const parts = permission.split('.');
    const action = parts.pop();
    const module = parts.join('.');

    return Boolean(user?.access?.permissions?.[module]?.[action]);
  }

  return Boolean(user?.access?.[permission]);
}

export function filterMenuByAccess(items, user) {
  return items
    .map((item) => {
      if (item.children) {
        const children = filterMenuByAccess(item.children, user);
        return children.length ? { ...item, children } : null;
      }

      return hasPermission(user, item.permission) ? item : null;
    })
    .filter(Boolean);
}
