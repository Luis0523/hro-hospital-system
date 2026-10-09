package com.hro.system.carnet.controller;

import com.hro.system.auth.UsuarioContexto;
import com.hro.system.auth.dto.IdentidadUsuario;
import com.hro.system.carnet.dto.SalidaCarnetDTO;
import com.hro.system.carnet.service.ReporteSalidaCarnetsService;
import com.hro.system.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/** Reporte de salida de expedientes (carnets encontrados) para la Estación de Archivo. */
@RestController
@RequestMapping("/carnets/salida")
@RequiredArgsConstructor
@Tag(name = "Carnets - Reporte de salida", description = "Listado y PDF de los expedientes encontrados (salida del archivo)")
public class CarnetReporteController {

    private final ReporteSalidaCarnetsService servicio;

    @GetMapping
    @Operation(summary = "Listar expedientes de salida (encontrados) de una fecha")
    public ResponseEntity<ApiResponse<SalidaCarnetDTO.Reporte>> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(ApiResponse.ok(servicio.listar(fecha), "Salida de expedientes obtenida"));
    }

    @GetMapping("/pdf")
    @Operation(summary = "Descargar el reporte de salida en PDF")
    public ResponseEntity<byte[]> pdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        String usuario = UsuarioContexto.actual().map(IdentidadUsuario::nombreMostrar).orElse("-");
        byte[] pdf = servicio.generarPdf(fecha, usuario);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"reporte-salida.pdf\"")
                .body(pdf);
    }
}
