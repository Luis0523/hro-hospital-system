package com.hro.system.archivo.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Estadísticas administrativas del Jefe de Archivo: salidas del día por
 * estación (incluidas las de la Clínica de la Mujer y su clasificación
 * activo/pasivo), expedientes por estado actual y resumen del Cuaderno Rojo.
 */
public record DashboardJefeArchivoDTO(
        LocalDate fecha,
        long totalSalidas,
        long totalClinicaMujer,
        long totalActivos,
        long totalPasivos,
        List<EstacionSalidaTotal> porEstacion,
        List<EstadoTotal> porEstado,
        /** Totales del día por etiqueta configurable (preparado para estadísticas). */
        List<EtiquetaTotal> porEtiqueta,
        CuadernoRojoResumen cuadernoRojo
) {
    public record EstacionSalidaTotal(
            Long estacionId,
            String estacionNombre,
            long total,
            long clinicaMujer,
            long activos,
            long pasivos
    ) {
    }

    public record EstadoTotal(String estado, long total) {
    }

    public record EtiquetaTotal(String etiqueta, long total) {
    }

    public record CuadernoRojoResumen(
            LocalDate fecha,
            int egresosHospitalarios,
            int sobresEmergencia,
            int sobresSellados,
            int tia,
            boolean registrado
    ) {
    }
}
