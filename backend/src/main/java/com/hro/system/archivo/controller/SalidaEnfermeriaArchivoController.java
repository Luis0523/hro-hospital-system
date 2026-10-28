package com.hro.system.archivo.controller;

import com.hro.system.archivo.dto.ActualizarSalidaEnfermeriaArchivoRequestDTO;
import com.hro.system.archivo.dto.RegistrarSalidaEnfermeriaArchivoRequestDTO;
import com.hro.system.archivo.dto.SalidaEnfermeriaArchivoResponseDTO;
import com.hro.system.archivo.service.SalidaEnfermeriaArchivoService;
import com.hro.system.auth.UsuarioContexto;
import com.hro.system.auth.dto.IdentidadUsuario;
import com.hro.system.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/salidas-enfermeria-archivo")
@RequiredArgsConstructor
@Tag(name = "Salidas de Enfermería a Archivo",
        description = "Registro digital de expedientes entregados por Enfermería a Archivo")
public class SalidaEnfermeriaArchivoController {

    private final SalidaEnfermeriaArchivoService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('enfermeria', 'jefe_enfermeria', 'administrador')")
    @Operation(summary = "Registrar salida de Enfermería a Archivo",
            description = "Consulta el expediente en el hospital y guarda la etiqueta de la salida.")
    public ResponseEntity<ApiResponse<SalidaEnfermeriaArchivoResponseDTO>> registrar(
            @Valid @RequestBody RegistrarSalidaEnfermeriaArchivoRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(
                service.registrar(dto), "Salida de Enfermería a Archivo registrada"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('enfermeria', 'jefe_enfermeria', 'administrador')")
    @Operation(summary = "Actualizar una salida de Enfermería a Archivo")
    public ResponseEntity<ApiResponse<SalidaEnfermeriaArchivoResponseDTO>> actualizar(
            @PathVariable UUID id,
            @Valid @RequestBody ActualizarSalidaEnfermeriaArchivoRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(
                service.actualizar(id, dto), "Salida de Enfermería a Archivo actualizada"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('enfermeria', 'jefe_enfermeria', 'administrador')")
    @Operation(summary = "Eliminar una salida de Enfermería a Archivo")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable UUID id) {
        service.eliminar(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Salida de Enfermería a Archivo eliminada"));
    }

    @GetMapping
    @Operation(summary = "Listar salidas de Enfermería a Archivo")
    public ResponseEntity<ApiResponse<List<SalidaEnfermeriaArchivoResponseDTO>>> listar(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) Long estacionId) {
        return ResponseEntity.ok(ApiResponse.ok(
                service.listar(fecha, estacionId), "Salidas obtenidas"));
    }

    @GetMapping("/pdf")
    @PreAuthorize("hasAnyRole('enfermeria', 'jefe_enfermeria', 'administrador')")
    @Operation(summary = "Descargar el reporte PDF de Enfermería a Archivo")
    public ResponseEntity<byte[]> pdf(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) Long estacionId) {
        byte[] pdf = service.generarPdf(fecha, estacionId, usuarioActual());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"salida-enfermeria-archivo.pdf\"")
                .body(pdf);
    }

    private static String usuarioActual() {
        return UsuarioContexto.actual().map(IdentidadUsuario::nombreMostrar).orElse("-");
    }
}
