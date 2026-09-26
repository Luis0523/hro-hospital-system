package com.hro.system.agenda.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.UUID;

/**
 * Resumen de una cita que impide bloquear una fecha como día no laborable.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CitaAfectadaDTO {
    private Long id;
    private LocalTime horaEstimada;
    private String estado;
    private UUID pacienteId;
    private String pacienteNombre;
    private String subespecialidadNombre;
}
