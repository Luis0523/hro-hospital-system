package com.hro.system.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.security.SecurityProperties;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Resuelve y publica la identidad del usuario en el contexto de la petición.
 * <p>
 * No bloquea peticiones: si el proveedor no puede resolver una identidad, la petición continúa
 * y los servicios usan el {@code usuarioId} explícito del cuerpo/parámetros como respaldo.
 * <p>
 * Se ejecuta inmediatamente después de la cadena de Spring Security (que reinicia el contexto)
 * para que la identidad quede disponible durante el despacho al controlador. Cuando se habilite
 * el control de acceso por roles, esta lógica deberá integrarse dentro de la cadena de seguridad.
 */
@Component
@Order(SecurityProperties.DEFAULT_FILTER_ORDER + 1)
@RequiredArgsConstructor
@Slf4j
public class UsuarioAutenticadoFilter extends OncePerRequestFilter {

    private final ProveedorIdentidad proveedorIdentidad;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            if (!esRutaIgnorada(request)) {
                proveedorIdentidad.resolver(request).ifPresent(UsuarioContexto::establecer);
            }
            filterChain.doFilter(request, response);
        } finally {
            UsuarioContexto.limpiar();
        }
    }

    private boolean esRutaIgnorada(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri.endsWith("/health") || uri.contains("/v3/api-docs");
    }
}
