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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Reporte de salida de expedientes (carnets con salida de archivo) para la Estación de Archivo. */
@RestController
@RequestMapping("/carnets")
@RequiredArgsConstructor
@Tag(name = "Carnets - Reportes", description = "Listados y PDF de salida de archivo y salida de enfermería")
public class CarnetReporteController {

    private final ReporteSalidaCarnetsService servicio;

    @GetMapping("/salida")
    @Operation(summary = "Listar expedientes con salida de archivo de una fecha")
    public ResponseEntity<ApiResponse<SalidaCarnetDTO.Reporte>> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(ApiResponse.ok(servicio.listar(fecha), "Salida de archivo obtenida"));
    }

    @GetMapping("/salida/pdf")
    @Operation(summary = "Descargar el reporte de salida de archivo en PDF")
    public ResponseEntity<byte[]> pdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        byte[] pdf = servicio.generarPdf(fecha, usuarioActual());
        return pdfResponse(pdf, "reporte-salida-archivo.pdf");
    }

    @PostMapping("/salida/pdf")
    @Operation(summary = "Descargar el reporte de salida de archivo en PDF para carnets específicos (lote de la sesión)")
    public ResponseEntity<byte[]> pdfPorIds(@RequestBody(required = false) List<UUID> ids) {
        byte[] pdf = servicio.generarPdfPorIds(ids, usuarioActual());
        return pdfResponse(pdf, "reporte-salida-archivo.pdf");
    }

    @GetMapping("/salida-enfermeria")
    @Operation(summary = "Listar expedientes con salida de enfermería de una fecha")
    public ResponseEntity<ApiResponse<SalidaCarnetDTO.Reporte>> listarSalidaEnfermeria(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(ApiResponse.ok(servicio.listarSalidaEnfermeria(fecha), "Salida de enfermería obtenida"));
    }

    @GetMapping("/salida-enfermeria/pdf")
    @Operation(summary = "Descargar el reporte de salida de enfermería en PDF (sin firmas)")
    public ResponseEntity<byte[]> salidaEnfermeriaPdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        byte[] pdf = servicio.generarSalidaEnfermeriaPdf(fecha, usuarioActual());
        return pdfResponse(pdf, "reporte-salida-enfermeria.pdf");
    }

    private static String usuarioActual() {
        return UsuarioContexto.actual().map(IdentidadUsuario::nombreMostrar).orElse("-");
    }

    private static ResponseEntity<byte[]> pdfResponse(byte[] pdf, String nombre) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nombre + "\"")
                .body(pdf);
    }
}
