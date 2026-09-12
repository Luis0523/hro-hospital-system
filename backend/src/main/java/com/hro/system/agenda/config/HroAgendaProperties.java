package com.hro.system.agenda.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Parámetros de configuración provisionales (v1) para cálculo de agenda, ventanas e inasistencias.
 * <p>
 * NOTA IMPORTANTE:
 * Estos valores son provisionales. Se reemplazarán más adelante por un modelo calculado
 * basado en el estudio empírico de tiempos de consulta y tasas históricas de inasistencia por clínica.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "hro.agenda")
public class HroAgendaProperties {

    /**
     * Duración promedio de consulta por defecto (en minutos) si el médico o clínica no tienen configurado un valor específico.
     * TODO: Sustituir por duración estimada por subespecialidad/médico basada en estudio de tiempos reales.
     */
    private int duracionConsultaDefaultMinutos = 35;

    /**
     * Parámetros para el cálculo de la ventana de presentación en el comprobante del paciente.
     */
    private Ventana ventana = new Ventana();

    /**
     * Parámetros para la gestión de turnos y tiempos de gracia.
     */
    private Turnos turnos = new Turnos();

    @Data
    public static class Ventana {
        /**
         * Margen base inicial (en minutos) antes de la hora estimada.
         * TODO: Reemplazar por margen dinámico calculado por distribución de probabilidad de llegada.
         */
        private int margenBaseMinutos = 15;

        /**
         * Minutos de incremento por incertidumbre acumulada a medida que avanza la fila en el día.
         * TODO: Reemplazar por varianza estadística acumulada de tiempos de atención.
         */
        private int incrementoPorBloqueMinutos = 5;

        /**
         * Cantidad de turnos/posiciones en la fila que componen un bloque de incremento.
         */
        private int tamanioBloquePosiciones = 5;

        /**
         * Margen máximo superior de tolerancia (en minutos) para evitar ventanas excesivamente amplias.
         */
        private int margenMaximoMinutos = 45;
    }

    @Data
    public static class Turnos {
        /**
         * Tiempo de gracia (en segundos) que tiene un paciente para presentarse una vez que su turno es llamado.
         * TODO: Ajustar según distancia promedio de sala de espera a consultorio y perfil del paciente.
         */
        private int tiempoGraciaLlamadoSegundos = 180; // 3 minutos

        /**
         * Número máximo de reintentos de llamado antes de clasificar el turno automáticamente en 'no_responde'.
         */
        private int maxReintentosLlamado = 3;
    }
}
