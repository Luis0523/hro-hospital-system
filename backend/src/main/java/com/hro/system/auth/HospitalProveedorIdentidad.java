package com.hro.system.auth;

import com.hro.system.auth.dto.IdentidadUsuario;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Proveedor de identidad para el servicio externo local del hospital (modo {@code hro.auth.mode=external}).
 * <p>
 * STUB: el hospital aún no expone su servicio de autenticación, por lo que este proveedor todavía
 * no resuelve identidades. Cuando esté disponible, se implementará aquí la validación del token /
 * credenciales y el mapeo a {@link IdentidadUsuario}. El resto del sistema no requiere cambios.
 */
@Component
@ConditionalOnProperty(prefix = "hro.auth", name = "mode", havingValue = "external")
@Slf4j
public class HospitalProveedorIdentidad implements ProveedorIdentidad {

    @Override
    public Optional<IdentidadUsuario> resolver(HttpServletRequest request) {
        log.warn("Modo de autenticación 'external' activo pero el servicio del hospital aún no está configurado. "
                + "No se resolvió identidad para {} {}.", request.getMethod(), request.getRequestURI());
        return Optional.empty();
    }

    @Override
    public String modo() {
        return "external";
    }
}
