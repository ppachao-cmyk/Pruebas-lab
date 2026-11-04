function usuarioPublico(usuario) {
    return { id: usuario.id, nombre: usuario.nombre, email:
usuario.email };
}
module.exports = usuarioPublico;