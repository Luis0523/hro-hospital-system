package com.hro.system.auth.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de autenticación del backend HRO.
 * <p>
 * El sistema no autentica localmente: los usuarios provienen de un servicio externo del hospital
 * (aún no disponible). Mientras tanto se usa el modo "mock", que simula la identidad mediante
 * cabeceras HTTP y aprovisiona usuarios vía JIT (just-in-time).
 * <p>
 * Valores válidos de {@code hro.auth.mode}:
 * <ul>
 *   <li>{@code mock}     - simulación local con cabeceras (por defecto).</li>
 *   <li>{@code external} - integración con el servicio real del hospital (stub, pendiente).</li>
 * </ul>
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "hro.auth")
public class AuthProperties {

    /**
     * Modo de autenticación: "mock" (simulado) o "external" (servicio real del hospital).
     */
    private String mode = "mock";

    private Mock mock = new Mock();

    @Data
    public static class Mock {
        /**
         * Identificador externo usado cuando la petición no envía el header X-Usuario-Id.
         */
        private String defaultIdExterno = "admin-hro-01";

        /**
         * Rol usado cuando la petición no envía el header X-Usuario-Rol.
         * Debe ser uno de: personal_citas, enfermeria, medico, administrador, archivo.
         */
        private String defaultRol = "administrador";

        /**
         * Nombre a mostrar usado cuando la petición no envía el header X-Usuario-Nombre.
         */
        private String defaultNombre = "Usuario de Pruebas HRO";
    }
}
