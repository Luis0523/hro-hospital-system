package com.hro.system.dashboard.controller;

import com.hro.system.common.ApiResponse;
import com.hro.system.dashboard.dto.ResumenAdminDTO;
import com.hro.system.dashboard.service.DashboardAdminService;
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
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard (Admin)", description = "Indicadores agregados del panel administrativo calculados en backend")
public class DashboardAdminController {

    private final DashboardAdminService dashboardAdminService;

    @GetMapping("/resumen")
    @Operation(summary = "Resumen administrativo de una fecha",
            description = "Citas del día por estado, cupos disponibles/ocupados, inasistencias y alertas administrativas. Si no se envía fecha, usa hoy.")
    public ResponseEntity<ApiResponse<ResumenAdminDTO>> resumen(
            @Parameter(description = "Fecha (ISO: YYYY-MM-DD). Por defecto, hoy.")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(ApiResponse.ok(
                dashboardAdminService.obtenerResumen(fecha),
                "Resumen administrativo obtenido"));
    }
}
