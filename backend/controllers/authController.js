// controllers/authController.js
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const usuarioPublico = require('../utils/usuarioPublico');
const { NOMBRE_COOKIE } = require('../config/constantes');

const SALT_ROUNDS = 10;

// POST /api/auth/register
exports.register = async (req, res) => {
  const { nombre, email, password } = req.body ?? {};

  if (typeof nombre !== 'string' || typeof email !== 'string' || typeof password !== 'string'
      || !nombre || !email || !password) {
    return res.status(400).json({
      status: 'fail',
      message: 'Faltan campos obligatorios: nombre, email y password',
    });
  }

  // Hash asincrono con 10 salt rounds, antes de guardar el usuario
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // El email repetido lo detecta la base de datos (columna email con UNIQUE):
  // asi dos registros simultaneos con el mismo email no pueden pasar los dos.
  const { data, error } = await supabase
    .from('usuario')
    .insert({ nombre, email, password_hash: passwordHash })
    .select('id, nombre, email')
    .single();

  if (error?.code === '23505') {
    return res.status(409).json({ status: 'fail', message: 'Ese email ya está registrado' });
  }
  if (error) throw error;

  res.status(201).json({ status: 'success', data: usuarioPublico(data) });
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return res.status(400).json({ status: 'fail', message: 'Debes enviar email y password' });
  }

  const { data: usuario, error } = await supabase
    .from('usuario')
    .select('id, nombre, email, password_hash')
    .eq('email', email)
    .maybeSingle();

  if (error) throw error;

  if (!usuario) {
    return res.status(401).json({ status: 'fail', message: 'Credenciales inválidas' });
  }

  // bcrypt.compare compara la clave escrita con el hash guardado
  const coincide = await bcrypt.compare(password, usuario.password_hash);

  if (!coincide) {
    return res.status(401).json({ status: 'fail', message: 'Credenciales inválidas' });
  }

  req.session.userId = usuario.id;

  res.status(200).json({ status: 'success', data: usuarioPublico(usuario) });
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  req.session = null; // cookie-session: borrar la sesion
  res.clearCookie(NOMBRE_COOKIE);
  res.status(200).json({ status: 'success', message: 'Sesión cerrada correctamente' });
};
