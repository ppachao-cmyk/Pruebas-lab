const supabase = require('../config/supabase');
const aNumero = require('../utils/aNumero');

// Producto + nombre del vendedor + calificaciones de sus resenas, en una sola consulta.
// "usuario!vendedor_id" indica por cual llave foranea se une con la tabla usuario.
const SELECT_PRODUCTO = '*, vendedor:usuario!vendedor_id(nombre), resena(calificacion)';

// Limites de las columnas en la base (numeric(10,2) e integer)
const PRECIO_MAXIMO = 99999999.99;
const STOCK_MAXIMO = 2147483647;

// Convierte la fila de Supabase al formato que recibe el frontend:
// agrega el nombre del vendedor y el resumen de sus reseñas
function presentar(fila) {
  const { vendedor, resena, ...producto } = fila;
  const calificaciones = resena.map((r) => r.calificacion);
  const suma = calificaciones.reduce((acumulado, c) => acumulado + c, 0);
  return {
    ...producto,
    vendedor: vendedor ? vendedor.nombre : 'Usuario eliminado',
    promedio: calificaciones.length > 0 ? Math.round((suma / calificaciones.length) * 10) / 10 : null,
    totalResenas: calificaciones.length,
  };
}

function limpiarCampos(body, exigirTodos) {
  const { nombre, descripcion, precio, categoria, stock } = body ?? {};
  const limpio = {};

  if (exigirTodos || nombre !== undefined) {
    if (typeof nombre !== 'string' || nombre.trim().length < 3 || nombre.trim().length > 80) {
      return { error: 'El nombre debe tener entre 3 y 80 caracteres' };
    }
    limpio.nombre = nombre.trim();
  }

  if (exigirTodos || descripcion !== undefined) {
    if (typeof descripcion !== 'string' || !descripcion.trim() || descripcion.trim().length > 500) {
      return { error: 'La descripción es obligatoria (máximo 500 caracteres)' };
    }
    limpio.descripcion = descripcion.trim();
  }
  if (exigirTodos || precio !== undefined) {
    const valor = aNumero(precio);
    if (!Number.isFinite(valor) || valor <= 0 || valor > PRECIO_MAXIMO) {
      return { error: `El precio debe ser un número mayor a 0 (máximo ${PRECIO_MAXIMO})` };
    }
    limpio.precio = Math.round(valor * 100) / 100;
  }
  if (exigirTodos || categoria !== undefined) {
    if (typeof categoria !== 'string' || !categoria.trim() || categoria.trim().length > 30) {
      return { error: 'La categoría es obligatoria (máximo 30 caracteres)' };
    }
    limpio.categoria = categoria.trim();
  }

  if (exigirTodos || stock !== undefined) {
    const valor = aNumero(stock);
    if (!Number.isInteger(valor) || valor < 0 || valor > STOCK_MAXIMO) {
      return { error: 'El stock debe ser un número entero mayor o igual a 0' };
    }
    limpio.stock = valor;
  }

  return { limpio };
}

// Busca solo id y vendedor de un producto (para revisar permisos antes de editar o borrar)
async function buscarDueno(id) {
  const { data, error } = await supabase
    .from('producto')
    .select('id, vendedor_id')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

exports.listarProductos = async (req, res) => {
  const { categoria, buscar, vendedor } = req.query;

  let consulta = supabase
    .from('producto')
    .select(SELECT_PRODUCTO)
    .order('id', { ascending: false }); // los mas nuevos primero

  if (categoria) {
    // ilike = igualdad sin distinguir mayusculas; se escapan los comodines % y _
    consulta = consulta.ilike('categoria', String(categoria).replace(/[\\%_]/g, '\\$&'));
  }

  if (buscar) {
    // Se quitan los caracteres que tienen significado especial dentro de .or()
    const texto = String(buscar).replace(/[,()%_*\\"]/g, ' ').trim();
    if (texto) {
      consulta = consulta.or(`nombre.ilike.%${texto}%,descripcion.ilike.%${texto}%`);
    }
  }

  if (vendedor) {
    const idVendedor = Number(vendedor);
    if (!Number.isInteger(idVendedor)) {
      return res.status(200).json({ status: 'success', results: 0, data: [] });
    }
    consulta = consulta.eq('vendedor_id', idVendedor);
  }

  const { data, error } = await consulta;
  if (error) throw error;

  const lista = data.map(presentar);

  res.status(200).json({ status: 'success', results: lista.length, data: lista });
};

exports.obtenerProducto = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(404).json({ status: 'fail', message: 'Producto no encontrado' });
  }

  const { data, error } = await supabase
    .from('producto')
    .select(SELECT_PRODUCTO)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;

  if (!data) {
    return res.status(404).json({ status: 'fail', message: 'Producto no encontrado' });
  }
  res.status(200).json({ status: 'success', data: presentar(data) });
};

exports.crearProducto = async (req, res) => {
  const { error: errorValidacion, limpio } = limpiarCampos(req.body, true);
  if (errorValidacion) {
    return res.status(400).json({ status: 'fail', message: errorValidacion });
  }

  const { data, error } = await supabase
    .from('producto')
    .insert({
      ...limpio,
      vendedor_id: req.session.userId, // el vendedor sale de la sesion, nunca del body
    })
    .select(SELECT_PRODUCTO)
    .single();
  if (error) throw error;

  res.status(201).json({ status: 'success', data: presentar(data) });
};

exports.actualizarProducto = async (req, res) => {
  const id = Number(req.params.id);

  const existente = Number.isInteger(id) ? await buscarDueno(id) : null;

  if (!existente) {
    return res.status(404).json({ status: 'fail', message: 'Producto no encontrado' });
  }

  if (existente.vendedor_id !== req.session.userId) {
    return res.status(403).json({ status: 'fail', message: 'Solo el vendedor puede modificar este producto' });
  }

  const { error: errorValidacion, limpio } = limpiarCampos(req.body, false);

  if (errorValidacion) {
    return res.status(400).json({ status: 'fail', message: errorValidacion });
  }

  if (Object.keys(limpio).length === 0) {
    return res.status(400).json({ status: 'fail', message: 'No enviaste ningún campo para actualizar' });
  }

  const { data, error } = await supabase
    .from('producto')
    .update(limpio)
    .eq('id', id)
    .select(SELECT_PRODUCTO)
    .single();
  if (error) throw error;

  res.status(200).json({ status: 'success', data: presentar(data) });
};

exports.eliminarProducto = async (req, res) => {
  const id = Number(req.params.id);

  const existente = Number.isInteger(id) ? await buscarDueno(id) : null;

  if (!existente) {
    return res.status(404).json({ status: 'fail', message: 'Producto no encontrado' });
  }

  if (existente.vendedor_id !== req.session.userId) {
    return res.status(403).json({ status: 'fail', message: 'Solo el vendedor puede eliminar este producto' });
  }

  // Las reseñas del producto se borran solas (ON DELETE CASCADE) y las compras
  // quedan en el historial con producto_id en null (ON DELETE SET NULL).
  const { error } = await supabase.from('producto').delete().eq('id', id);
  if (error) throw error;

  res.status(200).json({ status: 'success', message: 'Producto eliminado correctamente' });
};
