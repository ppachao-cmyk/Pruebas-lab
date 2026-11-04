// public/main.js UNIMARKET
// Codigo del navegador: habla con la API de UniMarket usando fetch.
// Las cookies de sesion las manda el navegador solas, porque la pagina y la API son del mismo servidor.

// ===== SECCION 1: UTILIDADES =====

const CATEGORIAS = ['Libros y apuntes', 'Electrónica', 'Ropa y accesorios', 'Comida', 'Servicios', 'Otros'];

const COLOR_CATEGORIA = {
  'Libros y apuntes': '#3A6EA5',
  'Electrónica': '#5B4B8A',
  'Ropa y accesorios': '#B24A6B',
  'Comida': '#B07D1E',
  'Servicios': '#2E7D4F',
  'Otros': '#6B7785',
};

const colorDe = (categoria) => COLOR_CATEGORIA[categoria] || COLOR_CATEGORIA['Otros'];
const formatoPrecio = (numero) => 'S/ ' + Number(numero).toFixed(2);
const formatoFecha = (iso) => new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
const estrellas = (numero) => '★'.repeat(Math.round(numero)) + '☆'.repeat(5 - Math.round(numero));

// el(): crea elementos del DOM. Los textos entran con append(), o sea como TEXTO y nunca como HTML,
// asi que nadie puede meter codigo en un nombre o en un comentario.
function el(etiqueta, atributos = {}, ...hijos) {
  const nodo = document.createElement(etiqueta);

  Object.entries(atributos).forEach(([clave, valor]) => {
    if (valor === undefined || valor === null || valor === false) return;
    if (clave === 'class') nodo.className = valor;
    else if (clave.startsWith('on')) nodo.addEventListener(clave.slice(2), valor);
    else nodo.setAttribute(clave, valor === true ? '' : valor);
  });

  hijos.flat().forEach((hijo) => {
    if (hijo === undefined || hijo === null || hijo === false) return;
    nodo.append(hijo);
  });

  return nodo;
}

// api(): hace la peticion y, si la API responde con error (400, 401, 403...), lanza un Error con su mensaje
async function api(url, { method = 'GET', body } = {}) {
  const opciones = { method, headers: {} };

  if (body !== undefined) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(body);
  }

  const respuesta = await fetch(url, opciones);

  let json = {};
  try {
    json = await respuesta.json();
  } catch (error) {
    // la respuesta no traia JSON
  }

  if (!respuesta.ok) {
    const fallo = new Error(json.message || 'Ocurrió un error inesperado');
    fallo.status = respuesta.status;
    throw fallo;
  }

  return json;
}

const mensaje = document.querySelector('#mensaje');
let temporizadorMensaje;

function mostrarMensaje(texto, tipo = 'exito') {
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
  clearTimeout(temporizadorMensaje);
  temporizadorMensaje = setTimeout(() => { mensaje.className = 'mensaje oculto'; }, 6000);
}


// ===== SECCION 2: ESTADO Y NAVEGACION =====

let usuarioActual = null; // null = nadie inició sesión
const VISTAS = ['productos', 'detalle', 'auth', 'vender', 'cuenta'];

function mostrarVista(nombre) {
  VISTAS.forEach((vista) => {
    document.querySelector(`#vista-${vista}`).classList.toggle('oculto', vista !== nombre);
  });
  document.querySelectorAll('.enlace-menu').forEach((boton) => {
    boton.classList.toggle('activo', boton.dataset.vista === nombre);
  });
}

// irA(): cambia de vista y carga sus datos. "Vender" y "Mi cuenta" piden sesión iniciada.
function irA(nombre) {
  if ((nombre === 'vender' || nombre === 'cuenta') && !usuarioActual) {
    mostrarVista('auth');
    mostrarMensaje('Inicia sesión para continuar', 'error');
    return;
  }

  mostrarVista(nombre);
  if (nombre === 'productos') cargarProductos();
  if (nombre === 'vender') cargarMisProductos();
  if (nombre === 'cuenta') cargarCuenta();
}

function dibujarSesion() {
  const zona = document.querySelector('#zona-sesion');
  zona.textContent = '';

  if (usuarioActual) {
    zona.append(
      el('span', { class: 'saludo' }, `Hola, ${usuarioActual.nombre}`),
      el('button', { class: 'btn btn-pequeno btn-secundario', onclick: cerrarSesion }, 'Salir')
    );
  } else {
    zona.append(el('button', { class: 'btn btn-pequeno btn-oro', onclick: () => mostrarVista('auth') }, 'Entrar'));
  }
}


// ===== SECCION 3: REGISTRO, LOGIN Y LOGOUT =====

// Al abrir la pagina se pregunta a /api/perfil si ya hay una sesion activa
async function cargarSesion() {
  try {
    const json = await api('/api/perfil');
    usuarioActual = json.data;
  } catch (error) {
    usuarioActual = null;
  }
  dibujarSesion();
}

async function iniciarSesion(email, password) {
  const json = await api('/api/auth/login', { method: 'POST', body: { email, password } });
  usuarioActual = json.data;
  dibujarSesion();
  mostrarMensaje(`Bienvenido, ${usuarioActual.nombre}`);
  irA('productos');
}

async function cerrarSesion() {
  try {
    await api('/api/auth/logout', { method: 'POST' });
  } catch (error) {
    // si la sesion ya habia vencido, igual se limpia la pagina
  }
  usuarioActual = null;
  dibujarSesion();
  mostrarMensaje('Sesión cerrada');
  irA('productos');
}

const formLogin = document.querySelector('#form-login');
const formRegistro = document.querySelector('#form-registro');

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await iniciarSesion(
      document.querySelector('#login-email').value,
      document.querySelector('#login-password').value
    );
    formLogin.reset();
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
});

formRegistro.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.querySelector('#reg-nombre').value;
  const email = document.querySelector('#reg-email').value;
  const password = document.querySelector('#reg-password').value;

  try {
    await api('/api/auth/register', { method: 'POST', body: { nombre, email, password } });
    formRegistro.reset();
    await iniciarSesion(email, password); // despues de registrarse entra directo
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
});


// ===== SECCION 4: LISTA DE PRODUCTOS =====

const listaProductos = document.querySelector('#lista-productos');
const resumenLista = document.querySelector('#resumen-lista');
const inputBuscar = document.querySelector('#buscar');
const filtroCategoria = document.querySelector('#filtro-categoria');

function llenarCategorias() {
  filtroCategoria.append(el('option', { value: '' }, 'Todas las categorías'));
  CATEGORIAS.forEach((categoria) => {
    filtroCategoria.append(el('option', { value: categoria }, categoria));
    document.querySelector('#prod-categoria').append(el('option', { value: categoria }, categoria));
  });
}

function tarjetaProducto(producto, acciones) {
  const agotado = producto.stock === 0;

  return el('article', { class: 'ficha', style: `--color-categoria: ${colorDe(producto.categoria)}` },
    el('div', { class: 'ficha-cuerpo' },
      el('span', { class: 'ficha-categoria' }, producto.categoria),
      el('h3', {}, el('button', { class: 'ficha-titulo', onclick: () => abrirDetalle(producto.id) }, producto.nombre)),
      el('p', { class: 'ficha-vendedor' }, `Vende ${producto.vendedor}`),
      el('p', { class: 'ficha-resenas' },
        producto.promedio === null
          ? 'Sin reseñas todavía'
          : [el('span', { class: 'estrellas' }, estrellas(producto.promedio)), ` ${producto.promedio} (${producto.totalResenas})`]
      ),
      el('p', { class: 'ficha-stock' + (agotado ? ' agotado' : '') }, agotado ? 'Agotado' : `Quedan ${producto.stock}`),
      acciones
    ),
    el('div', { class: 'etiqueta-precio' }, formatoPrecio(producto.precio))
  );
}

function dibujarProductos(contenedor, productos, crearAcciones, textoVacio) {
  contenedor.textContent = '';

  if (productos.length === 0) {
    contenedor.append(el('p', { class: 'vacio' }, textoVacio));
    return;
  }

  productos.forEach((producto) => {
    contenedor.append(tarjetaProducto(producto, crearAcciones ? crearAcciones(producto) : null));
  });
}

async function cargarProductos() {
  const parametros = new URLSearchParams();
  const texto = inputBuscar.value.trim();

  if (texto) parametros.set('buscar', texto);
  if (filtroCategoria.value) parametros.set('categoria', filtroCategoria.value);

  const consulta = parametros.toString();

  try {
    const json = await api('/api/productos' + (consulta ? `?${consulta}` : ''));
    dibujarProductos(listaProductos, json.data, null, 'Todavía no hay productos con esos filtros.');
    resumenLista.textContent = json.results === 0
      ? ''
      : `${json.results} ${json.results === 1 ? 'producto publicado' : 'productos publicados'}`;
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

document.querySelector('#form-busqueda').addEventListener('submit', (e) => {
  e.preventDefault();
  cargarProductos();
});

// ===== SECCION 5: VENDER (PUBLICAR, EDITAR Y ELIMINAR) =====

const formProducto = document.querySelector('#form-producto');
const misProductos = document.querySelector('#mis-productos');
const btnCancelarEdicion = document.querySelector('#btn-cancelar-edicion');
let editandoProductoId = null; // null = publicando uno nuevo

formProducto.addEventListener('submit', async (e) => {
  e.preventDefault();

  const datos = {
    nombre: document.querySelector('#prod-nombre').value,
    categoria: document.querySelector('#prod-categoria').value,
    descripcion: document.querySelector('#prod-descripcion').value,
    precio: document.querySelector('#prod-precio').value,
    stock: document.querySelector('#prod-stock').value,
  };

  const url = editandoProductoId ? `/api/productos/${editandoProductoId}` : '/api/productos';
  const metodo = editandoProductoId ? 'PUT' : 'POST';

  try {
    await api(url, { method: metodo, body: datos });
    mostrarMensaje(editandoProductoId ? 'Producto actualizado' : 'Producto publicado');
    salirDeEdicionProducto();
    cargarMisProductos();
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
});

function empezarEdicionProducto(producto) {
  editandoProductoId = producto.id;
  document.querySelector('#prod-nombre').value = producto.nombre;
  document.querySelector('#prod-categoria').value = producto.categoria;
  document.querySelector('#prod-descripcion').value = producto.descripcion;
  document.querySelector('#prod-precio').value = producto.precio;
  document.querySelector('#prod-stock').value = producto.stock;

  document.querySelector('#titulo-form-producto').textContent = `Editar producto (número ${producto.id})`;
  document.querySelector('#btn-guardar-producto').textContent = 'Guardar cambios';
  btnCancelarEdicion.classList.remove('oculto');
  document.querySelector('#prod-nombre').focus();
}

function salirDeEdicionProducto() {
  editandoProductoId = null;
  formProducto.reset();
  document.querySelector('#titulo-form-producto').textContent = 'Publicar un producto';
  document.querySelector('#btn-guardar-producto').textContent = 'Publicar';
  btnCancelarEdicion.classList.add('oculto');
}

btnCancelarEdicion.addEventListener('click', salirDeEdicionProducto);

async function eliminarProducto(producto) {
  if (!confirm(`¿Seguro que quieres eliminar "${producto.nombre}"? También se borrarán sus reseñas.`)) return;

  try {
    const json = await api(`/api/productos/${producto.id}`, { method: 'DELETE' });
    mostrarMensaje(json.message);
    if (editandoProductoId === producto.id) salirDeEdicionProducto();
    cargarMisProductos();
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

async function cargarMisProductos() {
  try {
    const json = await api(`/api/productos?vendedor=${usuarioActual.id}`);
    dibujarProductos(
      misProductos,
      json.data,
      (producto) => el('div', { class: 'acciones' },
        el('button', { class: 'btn btn-pequeno', onclick: () => empezarEdicionProducto(producto) }, 'Editar'),
        el('button', { class: 'btn btn-pequeno btn-peligro', onclick: () => eliminarProducto(producto) }, 'Eliminar')
      ),
      'Todavía no publicaste productos.'
    );
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}


// ===== SECCION 6: MI CUENTA (COMPRAS Y VENTAS) =====

function tabla(columnas, filas, textoVacio) {
  if (filas.length === 0) return el('p', { class: 'vacio' }, textoVacio);

  return el('div', { class: 'tabla-scroll' },
    el('table', {},
      el('thead', {}, el('tr', {}, columnas.map((columna) => el('th', {}, columna)))),
      el('tbody', {}, filas.map((fila) => el('tr', {}, fila.map((celda) => el('td', {}, celda)))))
    )
  );
}

async function cargarCuenta() {
  document.querySelector('#datos-cuenta').replaceChildren(
    el('h2', {}, usuarioActual.nombre),
    el('p', {}, usuarioActual.email)
  );

  try {
    const [compras, ventas] = await Promise.all([api('/api/compras'), api('/api/ventas')]);

    document.querySelector('#tabla-compras').replaceChildren(
      tabla(
        ['Producto', 'Cantidad', 'Total', 'Vendedor', 'Fecha'],
        compras.data.map((c) => [c.producto_nombre, c.cantidad, formatoPrecio(c.total), c.vendedor, formatoFecha(c.fecha)]),
        'Todavía no hiciste compras.'
      )
    );

    document.querySelector('#tabla-ventas').replaceChildren(
      tabla(
        ['Producto', 'Cantidad', 'Total', 'Comprador', 'Fecha'],
        ventas.data.map((v) => [v.producto_nombre, v.cantidad, formatoPrecio(v.total), v.comprador, formatoFecha(v.fecha)]),
        'Todavía no vendiste nada.'
      )
    );
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

// ===== SECCION 7: DETALLE DEL PRODUCTO (COMPRA Y RESEÑAS) =====

async function abrirDetalle(id) {
  try {
    const [producto, resenas] = await Promise.all([
      api(`/api/productos/${id}`),
      api(`/api/productos/${id}/resenas`),
    ]);
    dibujarDetalle(producto.data, resenas.data);
    mostrarVista('detalle');
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

function bloqueCompra(producto, esDueno) {
  if (esDueno) {
    return el('p', { class: 'ficha-vendedor' }, 'Este producto es tuyo. Puedes editarlo desde la sección Vender.');
  }
  if (producto.stock === 0) {
    return el('p', { class: 'ficha-stock agotado' }, 'Producto agotado');
  }
  if (!usuarioActual) {
    return el('div', { class: 'compra' },
      el('button', { class: 'btn', onclick: () => mostrarVista('auth') }, 'Inicia sesión para comprar')
    );
  }

  const inputCantidad = el('input', { type: 'number', id: 'compra-cantidad', min: '1', max: String(producto.stock), value: '1' });

  return el('form', {
    class: 'compra',
    id: 'form-compra',
    onsubmit: async (e) => {
      e.preventDefault();
      try {
        const json = await api(`/api/productos/${producto.id}/comprar`, {
          method: 'POST',
          body: { cantidad: inputCantidad.value },
        });
        mostrarMensaje(`Compra realizada por ${formatoPrecio(json.data.total)}`);
        abrirDetalle(producto.id); // se vuelve a dibujar con el stock actualizado
      } catch (error) {
        mostrarMensaje(error.message, 'error');
      }
    },
  },
    el('div', { class: 'campo-cantidad' }, el('label', { for: 'compra-cantidad' }, 'Cantidad'), inputCantidad),
    el('button', { type: 'submit', class: 'btn' }, 'Comprar')
  );
}

function bloqueResenas(producto, resenas, esDueno) {
  const yaReseno = usuarioActual && resenas.some((r) => r.usuario_id === usuarioActual.id);

  const lista = resenas.length === 0
    ? [el('p', { class: 'vacio' }, 'Este producto todavía no tiene reseñas.')]
    : resenas.map((r) => el('article', { class: 'resena' },
        el('div', { class: 'resena-cabecera' },
          el('span', { class: 'estrellas' }, estrellas(r.calificacion)),
          el('span', { class: 'resena-autor' }, r.autor),
          el('span', { class: 'resena-fecha' }, formatoFecha(r.fecha))
        ),
        el('p', {}, r.comentario),
        usuarioActual && r.usuario_id === usuarioActual.id
          ? el('button', { class: 'btn btn-pequeno btn-peligro', onclick: () => eliminarResena(r.id, producto.id) }, 'Eliminar mi reseña')
          : null
      ));

  let formulario;

  if (esDueno) {
    formulario = null;
  } else if (!usuarioActual) {
    formulario = el('p', { class: 'vacio' }, 'Inicia sesión para dejar una reseña.');
  } else if (yaReseno) {
    formulario = el('p', { class: 'vacio' }, 'Ya dejaste tu reseña de este producto.');
  } else {
    const selectPuntaje = el('select', { id: 'resena-puntaje' },
      [5, 4, 3, 2, 1].map((n) => el('option', { value: String(n) }, `${n} ${n === 1 ? 'estrella' : 'estrellas'}`))
    );
    const textoComentario = el('textarea', { id: 'resena-comentario', rows: '3', maxlength: '500' });

    formulario = el('form', {
      class: 'panel',
      id: 'form-resena',
      onsubmit: async (e) => {
        e.preventDefault();
        try {
          await api(`/api/productos/${producto.id}/resenas`, {
            method: 'POST',
            body: { calificacion: selectPuntaje.value, comentario: textoComentario.value },
          });
          mostrarMensaje('Gracias por tu reseña');
          abrirDetalle(producto.id);
        } catch (error) {
          mostrarMensaje(error.message, 'error');
        }
      },
    },
      el('h3', {}, 'Deja tu reseña'),
      el('label', { for: 'resena-puntaje' }, 'Calificación'),
      selectPuntaje,
      el('label', { for: 'resena-comentario' }, 'Comentario'),
      textoComentario,
      el('button', { type: 'submit', class: 'btn' }, 'Publicar reseña')
    );
  }

  return el('section', { class: 'resenas', id: 'seccion-resenas' }, el('h2', {}, 'Reseñas'), lista, formulario);
}

function dibujarDetalle(producto, resenas) {
  const esDueno = usuarioActual && usuarioActual.id === producto.vendedor_id;

  document.querySelector('#detalle').replaceChildren(
    el('article', { class: 'detalle-producto', style: `--color-categoria: ${colorDe(producto.categoria)}` },
      el('span', { class: 'ficha-categoria' }, producto.categoria),
      el('h2', {}, producto.nombre),
      el('p', { class: 'detalle-precio' }, formatoPrecio(producto.precio)),
      el('p', {}, producto.descripcion),
      el('p', { class: 'ficha-vendedor' }, `Vende ${producto.vendedor}`),
      el('p', { class: 'ficha-resenas' },
        producto.promedio === null
          ? 'Sin reseñas todavía'
          : [el('span', { class: 'estrellas' }, estrellas(producto.promedio)), ` ${producto.promedio} de 5 (${producto.totalResenas})`]
      ),
      el('p', { class: 'ficha-stock' + (producto.stock === 0 ? ' agotado' : '') }, producto.stock === 0 ? 'Agotado' : `Quedan ${producto.stock} unidades`),
      bloqueCompra(producto, esDueno)
    ),
    bloqueResenas(producto, resenas, esDueno)
  );
}

async function eliminarResena(resenaId, productoId) {
  if (!confirm('¿Seguro que quieres eliminar tu reseña?')) return;

  try {
    const json = await api(`/api/resenas/${resenaId}`, { method: 'DELETE' });
    mostrarMensaje(json.message);
    abrirDetalle(productoId);
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}
// ===== SECCION 8: ARRANQUE =====

document.querySelectorAll('.enlace-menu').forEach((boton) => {
  boton.addEventListener('click', () => irA(boton.dataset.vista));
});

document.querySelector('#marca').addEventListener('click', (e) => {
  e.preventDefault();
  irA('productos');
});

document.querySelector('#volver').addEventListener('click', () => irA('productos'));

document.addEventListener('DOMContentLoaded', async () => {
  llenarCategorias();
  await cargarSesion();
  irA('productos');
});