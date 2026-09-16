package com.hro.system.auth.dto;

/**
 * Identidad de usuario resuelta para la petición actual.
 *
 * @param id            ID interno en {@code usuario_referencia} (usado para auditoría y FKs).
 * @param idExterno     Identificador del usuario en el sistema externo del hospital.
 * @param nombreMostrar Nombre visible del usuario.
 * @param rolPrincipal  Rol operativo (personal_citas, enfermeria, medico, administrador, archivo).
 */
public record IdentidadUsuario(
        Long id,
        String idExterno,
        String nombreMostrar,
        String rolPrincipal
) {
}
