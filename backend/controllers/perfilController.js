const supabase = require('../config/supabase');
const usuarioPublico = require('../utils/usuarioPublico');

exports.getPerfil = async (req, res) => {
  const { data: usuario, error } = await supabase
    .from('usuario')
    .select('id, nombre, email')
    .eq('id', req.session.userId)
    .maybeSingle();

  if (error) throw error;

  if (!usuario) {
    return res.status(401).json({ status: 'fail', message: 'Acceso no autorizado: inicia sesión primero' });
  }

  res.status(200).json({ status: 'success', data: usuarioPublico(usuario) });
};
