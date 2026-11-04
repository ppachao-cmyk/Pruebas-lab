// controllers/resenaController.js
const supabase = require('../config/supabase');
const aNumero = require('../utils/aNumero');

// Busca solo id y vendedor de un producto
async function buscarProducto(id) {
  if (!Number.isInteger(id)) return null;

  const { data, error } = await supabase
    .from('producto')
    .select('id, vendedor_id')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// GET /api/productos/:id/resenas   (publico)
exports.listarPorProducto = async (req, res) => {
  const id = Number(req.params.id);

  if (!(await buscarProducto(id))) {
    return res.status(404).json({ status: 'fail', message: 'Producto no encontrado' });
  }

  const { data, error } = await supabase
    .from('resena')
    .select('*, autor:usuario!usuario_id(nombre)')
    .eq('producto_id', id)
    .order('id', { ascending: false });
  if (error) throw error;

  const lista = data.map(({ autor, ...resena }) => ({
    ...resena,
    autor: autor ? autor.nombre : 'Usuario eliminado',
  }));

  res.status(200).json({ status: 'success', results: lista.length, data: lista });
};

// POST /api/productos/:id/resenas   (requiere sesion)
exports.crearResena = async (req, res) => {
  const id = Number(req.params.id);
  const producto = await buscarProducto(id);

  if (!producto) {
    return res.status(404).json({ status: 'fail', message: 'Producto no encontrado' });
  }

  if (producto.vendedor_id === req.session.userId) {
    return res.status(403).json({ status: 'fail', message: 'No puedes reseñar tu propio producto' });
  }

  const { calificacion, comentario } = req.body ?? {};
  const puntaje = aNumero(calificacion);

  if (!Number.isInteger(puntaje) || puntaje < 1 || puntaje > 5) {
    return res.status(400).json({ status: 'fail', message: 'La calificación debe ser un número entero de 1 a 5' });
  }

  if (typeof comentario !== 'string' || !comentario.trim() || comentario.trim().length > 500) {
    return res.status(400).json({ status: 'fail', message: 'El comentario es obligatorio (máximo 500 caracteres)' });
  }

  // Una reseña por usuario y producto: lo garantiza la restriccion UNIQUE (producto_id, usuario_id)
  const { data, error } = await supabase
    .from('resena')
    .insert({
      producto_id: id,
      usuario_id: req.session.userId, // sale de la sesion, nunca del body
      calificacion: puntaje,
      comentario: comentario.trim(),
    })
    .select()
    .single();

  if (error?.code === '23505') {
    return res.status(409).json({ status: 'fail', message: 'Ya reseñaste este producto' });
  }
  if (error) throw error;

  res.status(201).json({ status: 'success', data });
};

// DELETE /api/resenas/:id   (solo su autor)
exports.eliminarResena = async (req, res) => {
  const id = Number(req.params.id);

  let resena = null;
  if (Number.isInteger(id)) {
    const { data, error } = await supabase
      .from('resena')
      .select('id, usuario_id')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    resena = data;
  }

  if (!resena) {
    return res.status(404).json({ status: 'fail', message: 'Reseña no encontrada' });
  }

  if (resena.usuario_id !== req.session.userId) {
    return res.status(403).json({ status: 'fail', message: 'Solo el autor puede eliminar su reseña' });
  }

  const { error } = await supabase.from('resena').delete().eq('id', id);
  if (error) throw error;

  res.status(200).json({ status: 'success', message: 'Reseña eliminada correctamente' });
};
