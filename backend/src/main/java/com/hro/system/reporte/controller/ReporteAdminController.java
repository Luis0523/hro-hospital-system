package com.hro.system.reporte.controller;

import com.hro.system.common.ApiResponse;
import com.hro.system.reporte.dto.ReporteCitasPorEstadoDTO;
import com.hro.system.reporte.dto.ReporteDemandaEspecialidadDTO;
import com.hro.system.reporte.dto.ReporteUtilizacionCuposDTO;
import com.hro.system.reporte.service.ReporteAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/reportes")
@RequiredArgsConstructor
@Tag(name = "Reportes (Admin)", description = "Reportes operativos agregados calculados en backend")
public class ReporteAdminController {

    private final ReporteAdminService reporteAdminService;

    @GetMapping("/citas-por-estado")
    @Operation(summary = "Reporte de citas por estado",
            description = "Conteo de citas por estado en un rango de fechas. Por defecto, últimos 30 días.")
    public ResponseEntity<ApiResponse<ReporteCitasPorEstadoDTO>> citasPorEstado(
            @Parameter(description = "Fecha inicial (ISO: YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @Parameter(description = "Fecha final (ISO: YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        return ResponseEntity.ok(ApiResponse.ok(
                reporteAdminService.citasPorEstado(fechaInicio, fechaFin),
                "Reporte de citas por estado obtenido"));
    }

    @GetMapping("/demanda-por-especialidad")
    @Operation(summary = "Reporte de demanda por especialidad",
            description = "Total de citas, atendidas e inasistencias por especialidad en un rango de fechas. Por defecto, últimos 30 días.")
    public ResponseEntity<ApiResponse<ReporteDemandaEspecialidadDTO>> demandaPorEspecialidad(
            @Parameter(description = "Fecha inicial (ISO: YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @Parameter(description = "Fecha final (ISO: YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        return ResponseEntity.ok(ApiResponse.ok(
                reporteAdminService.demandaPorEspecialidad(fechaInicio, fechaFin),
                "Reporte de demanda por especialidad obtenido"));
    }

    @GetMapping("/utilizacion-cupos")
    @Operation(summary = "Reporte de utilización de cupos",
            description = "Capacidad, cupos ocupados/disponibles y porcentaje de utilización en un rango. Filtro opcional por subespecialidad. Por defecto, últimos 30 días.")
    public ResponseEntity<ApiResponse<ReporteUtilizacionCuposDTO>> utilizacionCupos(
            @Parameter(description = "Fecha inicial (ISO: YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @Parameter(description = "Fecha final (ISO: YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @Parameter(description = "Filtro opcional por subespecialidad") @RequestParam(required = false) Long subespecialidadId) {
        return ResponseEntity.ok(ApiResponse.ok(
                reporteAdminService.utilizacionCupos(fechaInicio, fechaFin, subespecialidadId),
                "Reporte de utilización de cupos obtenido"));
    }
}
