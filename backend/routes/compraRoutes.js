// routes/compraRoutes.js   (montado en /api)
const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compraController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/compras', authMiddleware, compraController.misCompras);
router.get('/ventas', authMiddleware, compraController.misVentas);

module.exports = router;