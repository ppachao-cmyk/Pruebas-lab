// utils/aNumero.js
// Convierte a numero solo si llego un numero o un texto no vacio. Todo lo demas da NaN.
// Evita que '' , true o null se conviertan en 0 o 1 sin que nadie lo note.
function aNumero(valor) {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string' && valor.trim() !== '') return Number(valor);
  return NaN;
}

module.exports = aNumero;
