package com.hro.system.espacio.controller;

import com.hro.system.common.ApiResponse;
import com.hro.system.espacio.dto.AsignacionDiariaResponseDTO;
import com.hro.system.espacio.dto.AsignacionVistaItemDTO;
import com.hro.system.espacio.dto.CoberturaFaltanteDTO;
import com.hro.system.espacio.dto.CrearAsignacionDiariaRequestDTO;
import com.hro.system.espacio.service.AsignacionDiariaEspacioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/asignaciones-diarias")
@RequiredArgsConstructor
@Tag(name = "Asignación Diaria", description = "Qué subespecialidad ocupa cada espacio físico cada día, su cierre y cobertura")
public class AsignacionDiariaEspacioController {

    private final AsignacionDiariaEspacioService asignacionService;

    @PostMapping
    @PreAuthorize("hasAnyRole('jefe_enfermeria', 'administrador')")
    @Operation(summary = "Asignar subespecialidad a un espacio en una fecha")
    public ResponseEntity<ApiResponse<AsignacionDiariaResponseDTO>> crear(@Valid @RequestBody CrearAsignacionDiariaRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(asignacionService.crear(dto), "Asignación diaria creada"));
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('jefe_enfermeria', 'administrador')")
    @Operation(summary = "Seleccionar/actualizar la subespecialidad de una sala (upsert)",
            description = "Crea la asignación si no existe o actualiza la subespecialidad si ya existe. Pensado para el select del panel del jefe de enfermería.")
    public ResponseEntity<ApiResponse<AsignacionDiariaResponseDTO>> upsert(@Valid @RequestBody CrearAsignacionDiariaRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(asignacionService.upsert(dto), "Selección de sala guardada"));
    }

    @GetMapping
    @Operation(summary = "Listar la asignación de una fecha")
    public ResponseEntity<ApiResponse<List<AsignacionDiariaResponseDTO>>> listar(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(ApiResponse.ok(asignacionService.listarPorFecha(fecha), "Asignación del día"));
    }

    @GetMapping("/vista")
    @Operation(summary = "Vista operativa (salas + selección)",
            description = "Todas las salas activas (del nivel indicado, o todas) con la subespecialidad seleccionada para la fecha (o nula si no hay).")
    public ResponseEntity<ApiResponse<List<AsignacionVistaItemDTO>>> vista(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) Short nivel) {
        return ResponseEntity.ok(ApiResponse.ok(asignacionService.vista(fecha, nivel), "Vista de asignación diaria"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('jefe_enfermeria', 'administrador')")
    @Operation(summary = "Eliminar una asignación (solo si el día está abierto)")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Long id) {
        asignacionService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Asignación eliminada"));
    }

    @PostMapping("/{id}/reasignar")
    @PreAuthorize("hasAnyRole('jefe_enfermeria', 'administrador')")
    @Operation(summary = "Reasignación en caliente", description = "Única vía para cambiar una fecha ya cerrada. Queda auditada.")
    public ResponseEntity<ApiResponse<AsignacionDiariaResponseDTO>> reasignar(
            @PathVariable Long id,
            @RequestParam UUID nuevoEspacioFisicoId,
            @RequestParam(required = false) String motivo) {
        return ResponseEntity.ok(ApiResponse.ok(
                asignacionService.reasignarEnCaliente(id, nuevoEspacioFisicoId, motivo),
                "Reasignación en caliente aplicada"));
    }

    @GetMapping("/cobertura")
    @Operation(summary = "Verificar cobertura", description = "Devuelve las subespecialidades con médicos programados ese día que aún no tienen espacio asignado.")
    public ResponseEntity<ApiResponse<List<CoberturaFaltanteDTO>>> cobertura(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(ApiResponse.ok(asignacionService.verificarCobertura(fecha), "Cobertura verificada"));
    }

    @PostMapping("/cerrar")
    @PreAuthorize("hasAnyRole('jefe_enfermeria', 'administrador')")
    @Operation(summary = "Cerrar la asignación del día", description = "Bloquea la edición libre; exige cobertura completa.")
    public ResponseEntity<ApiResponse<Void>> cerrar(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        asignacionService.cerrarDia(fecha);
        return ResponseEntity.ok(ApiResponse.ok(null, "Asignación del día cerrada"));
    }

    @PostMapping("/duplicar")
    @PreAuthorize("hasAnyRole('jefe_enfermeria', 'administrador')")
    @Operation(summary = "Duplicar la asignación de una fecha anterior", description = "Atajo de UX: copia las filas de una fecha origen hacia la fecha destino (editable después).")
    public ResponseEntity<ApiResponse<Integer>> duplicar(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaOrigen,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDestino) {
        int copiadas = asignacionService.duplicarDesde(fechaOrigen, fechaDestino);
        return ResponseEntity.ok(ApiResponse.ok(copiadas, "Asignaciones duplicadas: " + copiadas));
    }
}
