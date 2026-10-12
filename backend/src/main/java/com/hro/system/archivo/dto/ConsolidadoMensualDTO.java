package com.hro.system.archivo.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Consolidado mensual de Archivo, espejo del "Informe Estadístico de Archivo"
 * del Excel legado.
 * <p>
 * - {@code informe} = Tabla 1 (resumen por día). Solo se calculan los campos que
 * el sistema conoce: {@code hdc} (carnets del día) y {@code hd} (depurados del
 * día). El resto de columnas del Excel (EH, HDT, SOBRES, HR, TIA) no se capturan
 * todavía y por eso no vienen aquí (el frontend las muestra como pendientes).
 * - {@code detalle} = Tabla 2 (por especialidad, por día).
 * - {@code totales} = acumulados del rango.
 */
public record ConsolidadoMensualDTO(
        Rango rango,
        List<InformeDia> informe,
        List<DetalleDia> detalle,
        Totales totales
) {
    public record Rango(LocalDate desde, LocalDate hasta) {
    }

    /** Tabla 1: HDC = carnets del día; HD = depurados del día. */
    public record InformeDia(LocalDate dia, long hdc, long hd) {
    }

    /** Tabla 2: desglose por especialidad del día. */
    public record DetalleDia(LocalDate dia, long total, List<ConsolidadoDiarioDTO.EspecialidadTotal> porEspecialidad) {
    }

    public record Totales(
            long totalCarnets,
            long totalDepurados,
            List<ConsolidadoDiarioDTO.EspecialidadTotal> porEspecialidad
    ) {
    }
}
