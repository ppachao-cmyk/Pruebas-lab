// routes/resenaRoutes.js   (montado en /api/resenas)
const express = require('express');
const router = express.Router();
const resenaController = require('../controllers/resenaController');
const authMiddleware = require('../middlewares/authMiddleware');

router.delete('/:id', authMiddleware, resenaController.eliminarResena);

module.exports = router;
