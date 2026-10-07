package com.hro.system.archivo.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Evento de movimiento de un ciclo, forma única para la tabla y el feed del
 * Dashboard de Archivo (docs/instrucciones/dashboard-archivo.md §8.2).
 */
public record EventoMovimientoDTO(
        Long id,
        UUID expedienteId,
        String numeroExpediente,
        String pacienteNombre,
        String estadoAnterior,
        String estadoNuevo,
        String usuarioNombre,
        String observacion,
        OffsetDateTime fechaMovimiento
) {
}
