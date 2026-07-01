export function isSuperAdmin(user) {
  return user?.role === 'super_admin';
}

export function isAdmin(user) {
  return (
    user?.role === 'admin' ||
    user?.role === 'super_admin'
  );
}

export function isEditor(user) {
  return (
    user?.role === 'editor' ||
    isAdmin(user)
  );
}

export function isViewer(user) {
  return !!user;
}