package com.hro.system.integracion.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de la integración con el API de expedientes del hospital (FHIR).
 * Las credenciales se leen de variables de entorno y nunca se versionan.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "hro.integracion.expedientes")
public class IntegracionExpedientesProperties {

    /** URL base del API de pacientes (termina en /Patient/). */
    private String url;

    private String username;

    private String password;

    /** Timeout de conexión/lectura en milisegundos. */
    private long timeoutMs = 5000;
}
