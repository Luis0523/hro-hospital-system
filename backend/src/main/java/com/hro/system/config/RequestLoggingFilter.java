package com.hro.system.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Registra en consola (stdout, capturado por Fly.io) cada peticion HTTP entrante
 * con su metodo, ruta, codigo de respuesta, duracion e IP de origen.
 * Util para comprobar en los logs que las peticiones del frontend llegan al backend.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class RequestLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        long inicio = System.currentTimeMillis();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long duracion = System.currentTimeMillis() - inicio;
            if (!esRutaIgnorada(request)) {
                logPeticion(request, response.getStatus(), duracion);
            }
        }
    }

    private boolean esRutaIgnorada(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri.endsWith("/health") || uri.contains("/v3/api-docs");
    }

    private void logPeticion(HttpServletRequest request, int status, long duracion) {
        String query = request.getQueryString();
        log.info("{} {} {}{} -> {} ({} ms) ip={}",
                emojiPorStatus(status),
                request.getMethod(),
                request.getRequestURI(),
                query != null ? "?" + query : "",
                status,
                duracion,
                obtenerIpCliente(request));
    }

    private String emojiPorStatus(int status) {
        if (status >= 500) {
            return "\u274C";
        }
        if (status >= 400) {
            return "\u26A0\uFE0F";
        }
        return "\u2705";
    }

    private String obtenerIpCliente(HttpServletRequest request) {
        String ip = request.getHeader("Fly-Client-IP");
        if (ip == null || ip.isBlank()) {
            ip = request.getHeader("X-Forwarded-For");
        }
        if (ip == null || ip.isBlank()) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
