function authMiddleware(req, res, next) {
  if (req.session && req.session.userId) {
    return next(); // usuario autenticado
  }

  return res.status(401).json({
    status: 'fail',
    message: 'Acceso no autorizado: inicia sesión primero',
  });
}

module.exports = authMiddleware;