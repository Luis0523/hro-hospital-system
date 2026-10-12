package com.hro.system.archivo.controller;

import com.hro.system.archivo.dto.ConsolidadoDiarioDTO;
import com.hro.system.archivo.dto.ConsolidadoMensualDTO;
import com.hro.system.archivo.service.ConsolidadoArchivoService;
import com.hro.system.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
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
@RequestMapping("/archivo/consolidado")
@RequiredArgsConstructor
@Tag(name = "Archivo - Consolidado", description = "Consolidado diario y mensual del trabajo de Archivo")
public class ArchivoConsolidadoController {

    private final ConsolidadoArchivoService consolidadoService;

    @GetMapping("/diario")
    @Operation(summary = "Consolidado diario por especialidad",
            description = "Total de expedientes del día y su desglose por especialidad (fuente: carnets). Fecha por defecto: hoy.")
    public ResponseEntity<ApiResponse<ConsolidadoDiarioDTO>> diario(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(ApiResponse.ok(
                consolidadoService.diario(fecha), "Consolidado diario obtenido"));
    }

    @GetMapping("/mensual")
    @Operation(summary = "Consolidado mensual (Informe Estadístico)",
            description = "Informe por día (HDC/HD), detalle por especialidad por día y totales del rango. "
                    + "Use anio+mes, o bien desde/hasta. Por defecto: mes actual.")
    public ResponseEntity<ApiResponse<ConsolidadoMensualDTO>> mensual(
            @RequestParam(required = false) Integer anio,
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(ApiResponse.ok(
                consolidadoService.mensual(anio, mes, desde, hasta), "Consolidado mensual obtenido"));
    }
}
