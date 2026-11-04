// routes/productoRoutes.js   (montado en /api/productos)
const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const compraController = require('../controllers/compraController');
const resenaController = require('../controllers/resenaController');
const authMiddleware = require('../middlewares/authMiddleware');

// Productos
router.get('/', productoController.listarProductos);
router.get('/:id', productoController.obtenerProducto);
router.post('/', authMiddleware, productoController.crearProducto);
router.put('/:id', authMiddleware, productoController.actualizarProducto);
router.delete('/:id', authMiddleware, productoController.eliminarProducto);

// Compra simulada de un producto
router.post('/:id/comprar', authMiddleware, compraController.comprar);

// Reseñas de un producto
router.get('/:id/resenas', resenaController.listarPorProducto);
router.post('/:id/resenas', authMiddleware, resenaController.crearResena);

module.exports = router;
