// controllers/compraController.js
const supabase = require('../config/supabase');
const aNumero = require('../utils/aNumero');

const CANTIDAD_MAXIMA = 2147483647; // limite de la columna integer

// POST /api/productos/:id/comprar   (requiere sesion)   Compra simulada: sin pagos
exports.comprar = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(404).json({ status: 'fail', message: 'Producto no encontrado' });
  }

  const cantidad = req.body?.cantidad === undefined ? 1 : aNumero(req.body.cantidad);

  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > CANTIDAD_MAXIMA) {
    return res.status(400).json({ status: 'fail', message: 'La cantidad debe ser un número entero mayor o igual a 1' });
  }

  // La funcion comprar_producto (ver sql/schema.sql) revisa el stock, lo descuenta y
  // registra la compra en una sola transaccion. El total lo calcula la base, no el cliente.
  const { data, error } = await supabase.rpc('comprar_producto', {
    p_producto: id,
    p_comprador: req.session.userId,
    p_cantidad: cantidad,
  });

  if (error) {
    if (error.message.includes('NO_ENCONTRADO')) {
      return res.status(404).json({ status: 'fail', message: 'Producto no encontrado' });
    }
    if (error.message.includes('PROPIO')) {
      return res.status(403).json({ status: 'fail', message: 'No puedes comprar tu propio producto' });
    }
    const stock = error.message.match(/STOCK:(\d+)/);
    if (stock) {
      return res.status(409).json({
        status: 'fail',
        message: `Stock insuficiente: quedan ${stock[1]} unidades`,
      });
    }
    throw error;
  }

  const compra = Array.isArray(data) ? data[0] : data;

  res.status(201).json({ status: 'success', message: 'Compra realizada', data: compra });
};

// GET /api/compras   (requiere sesion)
exports.misCompras = async (req, res) => {
  const { data, error } = await supabase
    .from('compra')
    .select('*, vendedor:usuario!vendedor_id(nombre)')
    .eq('comprador_id', req.session.userId)
    .order('id', { ascending: false });
  if (error) throw error;

  const lista = data.map(({ vendedor, ...compra }) => ({
    ...compra,
    vendedor: vendedor ? vendedor.nombre : 'Usuario eliminado',
  }));

  res.status(200).json({ status: 'success', results: lista.length, data: lista });
};

// GET /api/ventas   (requiere sesion)
exports.misVentas = async (req, res) => {
  const { data, error } = await supabase
    .from('compra')
    .select('*, comprador:usuario!comprador_id(nombre)')
    .eq('vendedor_id', req.session.userId)
    .order('id', { ascending: false });
  if (error) throw error;

  const lista = data.map(({ comprador, ...compra }) => ({
    ...compra,
    comprador: comprador ? comprador.nombre : 'Usuario eliminado',
  }));

  res.status(200).json({ status: 'success', results: lista.length, data: lista });
};
