export function hasPermission(module, permission) {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !user.permissions) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const modulePermissions = user.permissions[module];
    if (!modulePermissions || !modulePermissions.includes(permission)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  };
}

export function requirePermission(module, permission) {
  return (req, res, next) => hasPermission(module, permission)(req, res, next);
}

export function requireAnyPermission(module, permissions) {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !user.permissions) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const modulePermissions = user.permissions[module] || [];
    const hasAccess = permissions.some(p => modulePermissions.includes(p));
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  };
}
