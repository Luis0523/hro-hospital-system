package com.hro.system.archivo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Expediente que sale del Archivo en una jornada (para el documento "Salida de EXP").
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalidaExpedienteDTO {
    private UUID expedienteId;
    private String numeroExpediente;
    private String pacienteNombre;
    private Long citaId;
    private String subespecialidadNombre;
    private String horaEstimada;
    private String estadoActual;
}
