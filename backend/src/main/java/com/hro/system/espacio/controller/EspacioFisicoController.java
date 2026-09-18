package com.hro.system.espacio.controller;

import com.hro.system.common.ApiResponse;
import com.hro.system.espacio.dto.ActualizarEspacioFisicoRequestDTO;
import com.hro.system.espacio.dto.CrearEspacioFisicoRequestDTO;
import com.hro.system.espacio.dto.EspacioFisicoResponseDTO;
import com.hro.system.espacio.service.EspacioFisicoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/espacios-fisicos")
@RequiredArgsConstructor
@Tag(name = "Espacios Físicos", description = "Salas y consultorios. La especialidad se asigna por día, no aquí.")
public class EspacioFisicoController {

    private final EspacioFisicoService espacioFisicoService;

    @PostMapping
    @Operation(summary = "Crear espacio físico", description = "Registra una sala/consultorio con número, nivel y capacidad de camillas.")
    public ResponseEntity<ApiResponse<EspacioFisicoResponseDTO>> crear(@Valid @RequestBody CrearEspacioFisicoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(espacioFisicoService.crear(dto), "Espacio físico creado exitosamente"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar espacio físico")
    public ResponseEntity<ApiResponse<EspacioFisicoResponseDTO>> actualizar(
            @PathVariable Long id, @Valid @RequestBody ActualizarEspacioFisicoRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(espacioFisicoService.actualizar(id, dto), "Espacio físico actualizado"));
    }

    @GetMapping
    @Operation(summary = "Listar espacios físicos activos")
    public ResponseEntity<ApiResponse<List<EspacioFisicoResponseDTO>>> listar() {
        return ResponseEntity.ok(ApiResponse.ok(espacioFisicoService.listarActivos(), "Listado de espacios físicos"));
    }

    @GetMapping("/nivel/{nivel}")
    @Operation(summary = "Listar espacios físicos por nivel")
    public ResponseEntity<ApiResponse<List<EspacioFisicoResponseDTO>>> listarPorNivel(@PathVariable Short nivel) {
        return ResponseEntity.ok(ApiResponse.ok(espacioFisicoService.listarPorNivel(nivel), "Espacios del nivel " + nivel));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar espacio físico por ID")
    public ResponseEntity<ApiResponse<EspacioFisicoResponseDTO>> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(espacioFisicoService.buscarPorId(id), "Espacio físico localizado"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Poner fuera de servicio (soft delete)", description = "Marca el espacio como inactivo (baja o mantenimiento).")
    public ResponseEntity<ApiResponse<Void>> desactivar(@PathVariable Long id) {
        espacioFisicoService.cambiarEstado(id, false);
        return ResponseEntity.ok(ApiResponse.ok(null, "Espacio físico fuera de servicio"));
    }
}
