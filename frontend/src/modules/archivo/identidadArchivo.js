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

// Identidad efectiva que la Estación de Archivo asume ante la API. El backend
// (Fase 1) autoriza las transiciones de Archivo al rol `archivo` (o
// `administrador`); una identidad con otro rol responde 403. No se fija en cada
// request: `client.js` sigue enviando las cabeceras desde la identidad global.
export const IDENTIDAD_API_ARCHIVO = {
  idExterno: 'archivo-01',
  rol: 'archivo',
  nombre: USUARIO_ARCHIVO_POR_DEFECTO.nombre,
  puesto: USUARIO_ARCHIVO_POR_DEFECTO.puesto,
}

export function resolverIdentidadApiArchivo(usuario) {
  if (usuario && esRolArchivo(usuario.rol)) {
    return {
      idExterno: usuario.idExterno ?? usuario.id ?? IDENTIDAD_API_ARCHIVO.idExterno,
      rol: usuario.rol,
      nombre: usuario.nombre || IDENTIDAD_API_ARCHIVO.nombre,
      puesto: usuario.puesto || IDENTIDAD_API_ARCHIVO.puesto,
    }
  }

  return { ...IDENTIDAD_API_ARCHIVO }
}
