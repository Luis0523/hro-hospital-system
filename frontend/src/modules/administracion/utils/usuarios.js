// Constantes y etiquetas de presentación para Usuarios/Roles/Permisos.
// Los valores provienen del backend (RolSistema / TipoPermiso); NO son fuente de
// verdad: roles se leen de GET /roles y los tipos son valores confirmados del enum.

export const TIPOS_PERMISO = [
  { value: 'avanzar_turno', label: 'Avanzar turno' },
  { value: 'generar_orden_laboratorio', label: 'Generar orden de laboratorio' },
  { value: 'autorizar_cupo', label: 'Autorizar cupo' },
]

const ETIQUETAS_ROL = {
  personal_citas: 'Personal de citas',
  enfermeria: 'Enfermería',
  medico: 'Médico',
  administrador: 'Administrador',
  archivo: 'Archivo',
  jefe_enfermeria: 'Jefe de enfermería',
}

export function etiquetaRol(valor) {
  return ETIQUETAS_ROL[valor] ?? valor ?? ''
}

export function etiquetaTipoPermiso(valor) {
  return TIPOS_PERMISO.find((tipo) => tipo.value === valor)?.label ?? valor ?? ''
}
