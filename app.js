// app.js
require('dotenv').config({ quiet: true }); // carga el archivo .env ANTES de leer process.env

const express = require('express');
const session = require('cookie-session');
const path = require('path');

const { NOMBRE_COOKIE } = require('./config/constantes');
const authRoutes = require('./routes/authRoutes');
const perfilRoutes = require('./routes/perfilRoutes');
const productoRoutes = require('./routes/productoRoutes');
const resenaRoutes = require('./routes/resenaRoutes');
const compraRoutes = require('./routes/compraRoutes');

const app = express();
app.set('trust proxy', 1); // Vercel esta detras de un proxy (necesario para cookies secure)
const PORT = process.env.PORT || 3000;

// ---------- Middlewares globales ----------
app.use(express.json());

// La pagina esta en ../frontend. Solo se entregan index.html y la carpeta pub/.
// La carpeta priv/ NO se entrega: esta reservada para paginas privadas.
const FRONTEND = path.join(__dirname, '..', 'frontend');

app.use('/pub', express.static(path.join(FRONTEND, 'pub')));
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND, 'index.html'));
});

app.use(
  session({
    name: NOMBRE_COOKIE,
    keys: [process.env.SESSION_SECRET], // viene del archivo .env / variables de Vercel
    httpOnly: true,                     // JavaScript de la pagina no puede leer la cookie
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 2,         // dura 2 horas
  })
);

// ---------- Rutas ----------
app.use('/api/auth', authRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/resenas', resenaRoutes);
app.use('/api', compraRoutes);

// En local se levanta el servidor; en Vercel solo se exporta la app
if (require.main === module) {
  app.listen(PORT, () => console.log(`UniMarket escuchando en http://localhost:${PORT}`));
}

module.exports = app;
