package com.hro.system.auth;

import com.hro.system.auth.dto.IdentidadUsuario;
import com.hro.system.common.BusinessException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

/**
 * Acceso a la identidad del usuario autenticado en la petición actual.
 * <p>
 * Se apoya en {@link SecurityContextHolder}, por lo que la identidad vive únicamente
 * durante la petición HTTP (stateless) y se limpia al finalizar el filtro de autenticación.
 */
public final class UsuarioContexto {

    private UsuarioContexto() {
    }

    public static void establecer(IdentidadUsuario identidad) {
        Authentication authentication = new UsernamePasswordAuthenticationToken(identidad, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    public static Optional<IdentidadUsuario> actual() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof IdentidadUsuario identidad) {
            return Optional.of(identidad);
        }
        return Optional.empty();
    }

    public static Long idActual() {
        return actual()
                .map(IdentidadUsuario::id)
                .orElseThrow(() -> new BusinessException(
                        "No hay usuario autenticado. Envíe el header 'X-Usuario-Id' o el campo 'usuarioId'."));
    }

    /**
     * Resuelve el ID de usuario a auditar: prioriza el valor explícito enviado en la petición
     * (compatibilidad con clientes existentes) y, si no viene, usa la identidad autenticada.
     */
    public static Long resolverId(Long idExplicito) {
        return (idExplicito != null) ? idExplicito : idActual();
    }

    public static void limpiar() {
        SecurityContextHolder.clearContext();
    }
}
