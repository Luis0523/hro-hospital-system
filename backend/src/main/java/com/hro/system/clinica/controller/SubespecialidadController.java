package com.hro.system.clinica.controller;

import com.hro.system.common.ApiResponse;
import com.hro.system.clinica.dto.CrearSubespecialidadRequestDTO;
import com.hro.system.clinica.dto.SubespecialidadResponseDTO;
import com.hro.system.clinica.service.SubespecialidadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/subespecialidades")
@RequiredArgsConstructor
@Tag(name = "Subespecialidades", description = "Endpoints para administración de subespecialidades médicas asociadas a especialidades")
public class SubespecialidadController {

    private final SubespecialidadService subespecialidadService;

    @PostMapping
    @Operation(summary = "Crear nueva subespecialidad", description = "Registra una subespecialidad asociada a una especialidad.")
    public ResponseEntity<ApiResponse<SubespecialidadResponseDTO>> crear(@Valid @RequestBody CrearSubespecialidadRequestDTO dto) {
        SubespecialidadResponseDTO response = subespecialidadService.crearSubespecialidad(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Subespecialidad creada exitosamente"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar subespecialidad", description = "Actualiza el nombre o la especialidad padre de una subespecialidad.")
    public ResponseEntity<ApiResponse<SubespecialidadResponseDTO>> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody CrearSubespecialidadRequestDTO dto) {
        SubespecialidadResponseDTO response = subespecialidadService.actualizarSubespecialidad(id, dto);
        return ResponseEntity.ok(ApiResponse.ok(response, "Subespecialidad actualizada exitosamente"));
    }

    @GetMapping
    @Operation(summary = "Listar todas las subespecialidades activas", description = "Retorna el catálogo completo de subespecialidades activas.")
    public ResponseEntity<ApiResponse<List<SubespecialidadResponseDTO>>> listarTodas() {
        List<SubespecialidadResponseDTO> lista = subespecialidadService.listarTodasActivas();
        return ResponseEntity.ok(ApiResponse.ok(lista, "Subespecialidades obtenidas"));
    }

    @GetMapping("/especialidad/{especialidadId}")
    @Operation(summary = "Listar subespecialidades por especialidad", description = "Filtra las subespecialidades correspondientes a una especialidad médica.")
    public ResponseEntity<ApiResponse<List<SubespecialidadResponseDTO>>> listarPorEspecialidad(@PathVariable Long especialidadId) {
        List<SubespecialidadResponseDTO> lista = subespecialidadService.listarPorEspecialidad(especialidadId);
        return ResponseEntity.ok(ApiResponse.ok(lista, "Subespecialidades filtradas"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar subespecialidad por ID", description = "Obtiene los detalles de una subespecialidad.")
    public ResponseEntity<ApiResponse<SubespecialidadResponseDTO>> buscarPorId(@PathVariable Long id) {
        SubespecialidadResponseDTO response = subespecialidadService.buscarPorId(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Subespecialidad localizada"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Desactivar subespecialidad (Soft delete)", description = "Cambia el estado de la subespecialidad a inactiva.")
    public ResponseEntity<ApiResponse<Void>> desactivar(@PathVariable Long id) {
        subespecialidadService.cambiarEstado(id, false);
        return ResponseEntity.ok(ApiResponse.ok(null, "Subespecialidad desactivada exitosamente"));
    }
}
