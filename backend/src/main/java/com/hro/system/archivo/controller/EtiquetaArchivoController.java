package com.hro.system.archivo.controller;

import com.hro.system.archivo.dto.ActualizarEtiquetaArchivoRequestDTO;
import com.hro.system.archivo.dto.AsignarEtiquetasArchivoRequestDTO;
import com.hro.system.archivo.dto.CrearEtiquetaArchivoRequestDTO;
import com.hro.system.archivo.dto.EtiquetaArchivoResponseDTO;
import com.hro.system.archivo.dto.EtiquetaAsignadaResponseDTO;
import com.hro.system.archivo.service.EtiquetaArchivoService;
import com.hro.system.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Catálogo de etiquetas de Archivo y su asignación por estación.
 * Las etiquetas habilitan casillas operativas en la salida al Registro Médico.
 */
@RestController
@RequestMapping("/etiquetas-archivo")
@RequiredArgsConstructor
@Tag(name = "Archivo - Etiquetas",
        description = "Catálogo configurable de etiquetas por estación para las salidas de archivo")
public class EtiquetaArchivoController {

    private final EtiquetaArchivoService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('jefe_archivo', 'administrador')")
    @Operation(summary = "Listar el catálogo de etiquetas",
            description = "Filtra por estado: activos (por defecto), inactivos o todos.")
    public ResponseEntity<ApiResponse<List<EtiquetaArchivoResponseDTO>>> listar(
            @RequestParam(required = false) String estado) {
        return ResponseEntity.ok(ApiResponse.ok(
                service.listarCatalogo(estado), "Etiquetas de archivo"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('jefe_archivo', 'administrador')")
    @Operation(summary = "Buscar etiqueta por ID")
    public ResponseEntity<ApiResponse<EtiquetaArchivoResponseDTO>> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.buscar(id), "Etiqueta localizada"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('jefe_archivo', 'administrador')")
    @Operation(summary = "Crear etiqueta")
    public ResponseEntity<ApiResponse<EtiquetaArchivoResponseDTO>> crear(
            @Valid @RequestBody CrearEtiquetaArchivoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(service.crear(dto), "Etiqueta creada exitosamente"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('jefe_archivo', 'administrador')")
    @Operation(summary = "Actualizar etiqueta")
    public ResponseEntity<ApiResponse<EtiquetaArchivoResponseDTO>> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarEtiquetaArchivoRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(service.actualizar(id, dto), "Etiqueta actualizada"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('jefe_archivo', 'administrador')")
    @Operation(summary = "Desactivar etiqueta (baja lógica)",
            description = "La etiqueta deja de ofrecerse en las estaciones, pero no se elimina ni se altera el histórico.")
    public ResponseEntity<ApiResponse<EtiquetaArchivoResponseDTO>> desactivar(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.desactivar(id), "Etiqueta desactivada"));
    }

    @PatchMapping("/{id}/reactivar")
    @PreAuthorize("hasAnyRole('jefe_archivo', 'administrador')")
    @Operation(summary = "Reactivar etiqueta")
    public ResponseEntity<ApiResponse<EtiquetaArchivoResponseDTO>> reactivar(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.reactivar(id), "Etiqueta reactivada"));
    }

    @GetMapping("/estaciones/{estacionId}")
    @Operation(summary = "Etiquetas habilitadas en una estación",
            description = "Devuelve solo etiquetas activas y asignadas, en el orden configurado. Lo usa la estación de salida.")
    public ResponseEntity<ApiResponse<List<EtiquetaAsignadaResponseDTO>>> listarPorEstacion(
            @PathVariable Long estacionId) {
        return ResponseEntity.ok(ApiResponse.ok(
                service.listarAsignadas(estacionId), "Etiquetas de la estación"));
    }

    @PutMapping("/estaciones/{estacionId}")
    @PreAuthorize("hasAnyRole('jefe_archivo', 'administrador')")
    @Operation(summary = "Asignar etiquetas a una estación",
            description = "Reemplaza el conjunto y el orden. Las etiquetas retiradas se desactivan, no se eliminan.")
    public ResponseEntity<ApiResponse<List<EtiquetaAsignadaResponseDTO>>> asignar(
            @PathVariable Long estacionId,
            @Valid @RequestBody AsignarEtiquetasArchivoRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(
                service.reemplazarAsignacion(estacionId, dto.getEtiquetaIds()),
                "Etiquetas de la estación actualizadas"));
    }
}
