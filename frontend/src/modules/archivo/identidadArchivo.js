// Identidad mostrada por la Estación de Archivo. No depende de AuthContext
// (compartido) ni de la identidad de otras estaciones.
//
// Mientras no exista una sesión real de Archivo, el contexto de autenticación
// devuelve un usuario de desarrollo de otra estación. Este módulo solo adopta
// la identidad autenticada cuando su rol corresponde a Archivo; en cualquier
// otro caso usa una identidad coherente con Registro Médico.

export const USUARIO_ARCHIVO_POR_DEFECTO = {
  nombre: 'Personal de Archivo',
  puesto: 'Archivo / Registro Médico',
}

const ROLES_ARCHIVO = ['archivo', 'registro_medico', 'registro_medicos', 'registros_medicos']

function esRolArchivo(rol) {
  const valor = String(rol ?? '').toLowerCase()
  return valor.includes('archivo') || ROLES_ARCHIVO.includes(valor)
}

export function resolverUsuarioArchivo(usuario) {
  if (!usuario || !esRolArchivo(usuario.rol)) {
    return USUARIO_ARCHIVO_POR_DEFECTO
  }

  return {
    nombre: usuario.nombre || USUARIO_ARCHIVO_POR_DEFECTO.nombre,
    puesto: usuario.puesto || USUARIO_ARCHIVO_POR_DEFECTO.puesto,
  }
}
