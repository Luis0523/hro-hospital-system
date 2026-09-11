package com.hro.system.clinica.controller;

import com.hro.system.common.ApiResponse;
import com.hro.system.clinica.dto.CrearEspecialidadRequestDTO;
import com.hro.system.clinica.dto.EspecialidadResponseDTO;
import com.hro.system.clinica.service.EspecialidadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/especialidades")
@RequiredArgsConstructor
@Tag(name = "Especialidades", description = "Endpoints para administración de especialidades médicas (Medicina Interna, Pediatría, Cirugía, etc.)")
public class EspecialidadController {

    private final EspecialidadService especialidadService;

    @PostMapping
    @Operation(summary = "Crear nueva especialidad", description = "Registra una especialidad médica validando nombre único.")
    public ResponseEntity<ApiResponse<EspecialidadResponseDTO>> crear(@Valid @RequestBody CrearEspecialidadRequestDTO dto) {
        EspecialidadResponseDTO response = especialidadService.crearEspecialidad(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Especialidad creada exitosamente"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar especialidad", description = "Actualiza el nombre de una especialidad existente.")
    public ResponseEntity<ApiResponse<EspecialidadResponseDTO>> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody CrearEspecialidadRequestDTO dto) {
        EspecialidadResponseDTO response = especialidadService.actualizarEspecialidad(id, dto);
        return ResponseEntity.ok(ApiResponse.ok(response, "Especialidad actualizada exitosamente"));
    }

    @GetMapping
    @Operation(summary = "Listar especialidades activas", description = "Retorna el listado de especialidades médicas activas.")
    public ResponseEntity<ApiResponse<List<EspecialidadResponseDTO>>> listarActivas() {
        List<EspecialidadResponseDTO> lista = especialidadService.listarActivas();
        return ResponseEntity.ok(ApiResponse.ok(lista, "Especialidades obtenidas"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar especialidad por ID", description = "Obtiene los detalles de una especialidad.")
    public ResponseEntity<ApiResponse<EspecialidadResponseDTO>> buscarPorId(@PathVariable Long id) {
        EspecialidadResponseDTO response = especialidadService.buscarPorId(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Especialidad localizada"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Desactivar especialidad (Soft delete)", description = "Cambia el estado de la especialidad a inactiva.")
    public ResponseEntity<ApiResponse<Void>> desactivar(@PathVariable Long id) {
        especialidadService.cambiarEstado(id, false);
        return ResponseEntity.ok(ApiResponse.ok(null, "Especialidad desactivada exitosamente"));
    }
}
