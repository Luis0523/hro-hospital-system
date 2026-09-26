package com.hro.system.archivo.controller;

import com.hro.system.archivo.dto.ResumenArchivoDTO;
import com.hro.system.archivo.service.ArchivoResumenService;
import com.hro.system.auth.UsuarioContexto;
import com.hro.system.auth.dto.IdentidadUsuario;
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

@RestController
@RequestMapping("/archivo")
@RequiredArgsConstructor
@Tag(name = "Archivo - Resumen operativo", description = "Indicadores diarios y PDF del departamento de Archivo")
public class ArchivoResumenController {

    private final ArchivoResumenService archivoResumenService;

    @GetMapping("/resumen")
    @Operation(summary = "Resumen operativo diario",
            description = "Conteos por estado del ciclo y expedientes nuevos de una fecha. Fecha por defecto: hoy.")
    public ResponseEntity<ApiResponse<ResumenArchivoDTO>> resumen(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(ApiResponse.ok(archivoResumenService.obtener(fecha), "Resumen de archivo obtenido"));
    }

    @GetMapping("/resumen/pdf")
    @Operation(summary = "Descargar resumen diario en PDF",
            description = "Genera y descarga el PDF con los indicadores del día y el usuario generador.")
    public ResponseEntity<byte[]> resumenPdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        String usuario = UsuarioContexto.actual().map(IdentidadUsuario::nombreMostrar).orElse("-");
        byte[] pdf = archivoResumenService.generarPdf(fecha, usuario);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"resumen-archivo.pdf\"")
                .body(pdf);
    }
}
