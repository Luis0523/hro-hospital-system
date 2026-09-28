package com.hro.system.estacion.filter;

import com.hro.system.estacion.context.EstacionContexto;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.security.SecurityProperties;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Publica la estación de enfermería activa a partir del header {@code X-Estacion-Id}.
 * <p>
 * Tolerante a papel: si el header falta o viene vacío, la petición continúa sin estación
 * (los servicios deciden su comportamiento por defecto). Acepta el id numérico o el código.
 */
@Component
@Order(SecurityProperties.DEFAULT_FILTER_ORDER + 2)
@Slf4j
public class EstacionContextoFilter extends OncePerRequestFilter {

    private static final String HEADER = "X-Estacion-Id";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String valor = request.getHeader(HEADER);
            if (valor != null && !valor.isBlank()) {
                String limpio = valor.trim();
                if (limpio.matches("\\d+")) {
                    EstacionContexto.establecer(Long.valueOf(limpio), null);
                } else {
                    EstacionContexto.establecer(null, limpio);
                }
            }
            filterChain.doFilter(request, response);
        } finally {
            EstacionContexto.limpiar();
        }
    }
}
