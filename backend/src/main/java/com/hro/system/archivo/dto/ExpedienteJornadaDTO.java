package com.hro.system.archivo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.UUID;

/**
 * Fila de la jornada de archivo: una cita del día con los datos del expediente físico
 * a preparar y su estado actual en el ciclo (o {@code sin_ciclo} si aún no se preparó).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpedienteJornadaDTO {

    private Long citaId;
    private LocalTime horaEstimada;

    private UUID pacienteId;
    private String pacienteNombre;
    private String dpi;
    private String numeroExpediente;

    /** UUID del expediente físico (QR); {@code null} si el paciente aún no tiene expediente registrado. */
    private UUID expedienteId;

    private Long subespecialidadId;
    private String subespecialidadNombre;

    /** UUID del ciclo de esta cita; {@code null} si aún no existe. */
    private UUID cicloId;

    /** Estado actual del ciclo, o {@code sin_ciclo} si no hay ciclo creado. */
    private String estadoActual;

    private UbicacionArchivoResponseDTO ubicacionBase;
}
