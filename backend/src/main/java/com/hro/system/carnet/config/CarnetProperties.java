package com.hro.system.carnet.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Parámetros del circuito de carnets.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "hro.carnet")
public class CarnetProperties {

    /**
     * Tiempo mínimo (en minutos) que debe transcurrir desde la recepción en la
     * estación antes de poder devolver el expediente a Archivo.
     */
    private int minutosAntesDeDevolucion = 90;
}
