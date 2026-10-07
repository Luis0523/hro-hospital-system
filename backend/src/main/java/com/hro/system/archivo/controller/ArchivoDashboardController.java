package com.hro.system.archivo.controller;

import com.hro.system.archivo.dto.EstadisticasArchivoDTO;
import com.hro.system.archivo.dto.EventoMovimientoDTO;
import com.hro.system.archivo.service.ArchivoDashboardService;
import com.hro.system.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/archivo")
@RequiredArgsConstructor
@Tag(name = "Archivo - Dashboard", description = "Estadísticas y bitácora de movimientos para el Dashboard de Archivo")
public class ArchivoDashboardController {

    private final ArchivoDashboardService dashboardService;

    @GetMapping("/estadisticas")
    @Operation(summary = "Estadísticas del Dashboard de Archivo",
            description = "Totales, distribución por estado, serie diaria, por subespecialidad y permanencia promedio, en un rango de fechas. Fechas por defecto: hoy.")
    public ResponseEntity<ApiResponse<EstadisticasArchivoDTO>> estadisticas(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Long subespecialidadId) {
        return ResponseEntity.ok(ApiResponse.ok(
                dashboardService.estadisticas(desde, hasta, subespecialidadId),
                "Estadísticas de archivo obtenidas"));
    }

    @GetMapping("/movimientos")
    @Operation(summary = "Bitácora de movimientos de Archivo",
            description = "Movimientos paginados de un rango de fechas, opcionalmente filtrados por estado nuevo.")
    public ResponseEntity<ApiResponse<Page<EventoMovimientoDTO>>> movimientos(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) String estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                dashboardService.movimientos(desde, hasta, estado, page, size),
                "Movimientos de archivo obtenidos"));
    }
}
