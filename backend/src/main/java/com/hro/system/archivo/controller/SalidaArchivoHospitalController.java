package com.hro.system.archivo.controller;

import com.hro.system.archivo.dto.RegistrarSalidaArchivoHospitalRequestDTO;
import com.hro.system.archivo.dto.RegistrarSalidaArchivoManualRequestDTO;
import com.hro.system.archivo.dto.SalidaArchivoHospitalResponseDTO;
import com.hro.system.archivo.service.SalidaArchivoHospitalService;
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

/**
 * Salidas de archivo consultadas al Registro Médico (API del hospital).
 * Registro compartido por estación y fecha.
 */
@RestController
@RequestMapping("/salidas-archivo-hospital")
@RequiredArgsConstructor
@Tag(name = "Salidas de archivo (Registro Médico)",
        description = "Registra y lista expedientes que salen de archivo consultando el API del hospital")
public class SalidaArchivoHospitalController {

    private final SalidaArchivoHospitalService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('archivo', 'administrador')")
    @Operation(summary = "Registrar una salida consultando al hospital",
            description = "Consulta el API del hospital por número de expediente y registra la salida en la estación. 409 si ya fue marcado; 404 si no existe; 502 si falla la integración.")
    public ResponseEntity<ApiResponse<SalidaArchivoHospitalResponseDTO>> registrar(
            @Valid @RequestBody RegistrarSalidaArchivoHospitalRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(
                service.registrar(dto), "Salida de archivo registrada"));
    }

    @PostMapping("/manual")
    @PreAuthorize("hasAnyRole('archivo', 'administrador')")
    @Operation(summary = "Registrar una salida manual (sin consultar al hospital)",
            description = "Para expedientes que el API del hospital no reconoce. Guarda número y nombre en el listado compartido de la estación; no consulta ni actualiza el hospital. 409 si el expediente ya fue marcado.")
    public ResponseEntity<ApiResponse<SalidaArchivoHospitalResponseDTO>> registrarManual(
            @Valid @RequestBody RegistrarSalidaArchivoManualRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(
                service.registrarManual(dto), "Salida de archivo registrada manualmente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('archivo', 'administrador')")
    @Operation(summary = "Eliminar una salida de archivo registrada por error",
            description = "Borra la fila del listado compartido de la estación y deja de aparecer en el reporte. No afecta al hospital.")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable UUID id) {
        service.eliminar(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Salida de archivo eliminada"));
    }

    @GetMapping
    @Operation(summary = "Listar salidas de archivo por fecha y estación")
    public ResponseEntity<ApiResponse<List<SalidaArchivoHospitalResponseDTO>>> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) Long estacionId) {
        return ResponseEntity.ok(ApiResponse.ok(
                service.listar(fecha, estacionId), "Salidas de archivo obtenidas"));
    }

    @GetMapping("/pdf")
    @Operation(summary = "Descargar el reporte de salidas de archivo (PDF) por fecha y estación")
    public ResponseEntity<byte[]> pdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) Long estacionId) {
        byte[] pdf = service.generarPdf(fecha, estacionId, usuarioActual());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"salida-archivo-hospital.pdf\"")
                .body(pdf);
    }

    private static String usuarioActual() {
        return UsuarioContexto.actual().map(IdentidadUsuario::nombreMostrar).orElse("-");
    }
}
