package com.hro.system.archivo.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Consolidado diario de Archivo: total de expedientes/consultas del día y su
 * desglose por especialidad. Fuente: carnets del día (agregados en BD por la
 * función {@code fn_archivo_consolidado_diario}).
 */
public record ConsolidadoDiarioDTO(
        LocalDate fecha,
        long total,
        long totalDepurados,
        List<EspecialidadTotal> porEspecialidad
) {
    public record EspecialidadTotal(Long especialidadId, String especialidadNombre, long total) {
    }
}
