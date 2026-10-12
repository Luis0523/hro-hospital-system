package com.hro.system.carnet.dto;

import java.time.LocalDate;

/** Fila del reporte de salida de expedientes (carnets encontrados). */
public record SalidaCarnetDTO(
        String numeroExpediente,
        String especialidadNombre,
        String pacienteNombre,
        String hora
) {
    /** Envoltura del reporte de salida de una fecha. */
    public record Reporte(LocalDate fecha, long total, java.util.List<SalidaCarnetDTO> expedientes) {
    }
}
