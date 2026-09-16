package com.hro.system.auth;

import com.hro.system.auth.dto.IdentidadUsuario;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Optional;

/**
 * Contrato para resolver la identidad del usuario que realiza una petición.
 * <p>
 * La implementación activa se selecciona con {@code hro.auth.mode}:
 * {@code mock} (simulación con cabeceras) o {@code external} (servicio real del hospital).
 * Cuando el hospital habilite su servicio de autenticación local, solo se implementa
 * {@link com.hro.system.auth.HospitalProveedorIdentidad} sin tocar el resto del sistema.
 */
public interface ProveedorIdentidad {

    /**
     * Resuelve la identidad del usuario de la petición actual.
     *
     * @param request petición HTTP entrante
     * @return identidad resuelta, o vacío si no se pudo determinar
     */
    Optional<IdentidadUsuario> resolver(HttpServletRequest request);

    /**
     * @return nombre del modo activo ("mock" o "external") para bitácora de arranque.
     */
    String modo();
}
