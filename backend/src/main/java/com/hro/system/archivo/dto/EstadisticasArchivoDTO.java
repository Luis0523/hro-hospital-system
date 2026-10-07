package com.hro.system.archivo.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Estadísticas del Dashboard de Archivo en un rango de fechas. Forma acordada
 * con el frontend (docs/instrucciones/dashboard-archivo.md §6.2).
 */
public record EstadisticasArchivoDTO(
        Rango rango,
        Totales totales,
        List<EstadoTotal> porEstado,
        List<SerieDiaria> serieDiaria,
        List<UnidadTotal> porUnidad,
        List<Permanencia> permanencia
) {
    public record Rango(LocalDate desde, LocalDate hasta) {
    }

    public record Totales(
            long totalCiclos,
            long expedientesNuevos,
            long noLocalizado,
            long archivado,
            long entregado,
            long enTransito
    ) {
    }

    public record EstadoTotal(String estado, long total) {
    }

    public record SerieDiaria(LocalDate fecha, long transiciones, long ciclosNuevos, long noLocalizado) {
    }

    public record UnidadTotal(Long subespecialidadId, String nombre, long total, long noLocalizado) {
    }

    public record Permanencia(String estado, long minutosPromedio) {
    }
}
