package com.hro.system.clinica.controller;

import com.hro.system.common.ApiResponse;
import com.hro.system.common.EstadoFiltro;
import com.hro.system.clinica.dto.CrearSubespecialidadRequestDTO;
import com.hro.system.clinica.dto.SubespecialidadHorarioResponseDTO;
import com.hro.system.clinica.dto.SubespecialidadResponseDTO;
import com.hro.system.clinica.service.SubespecialidadHorarioService;
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
    private final SubespecialidadHorarioService subespecialidadHorarioService;

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
    @Operation(summary = "Listar subespecialidades", description = "Retorna el catálogo de subespecialidades. Filtra por estado: activos (por defecto), inactivos o todos.")
    public ResponseEntity<ApiResponse<List<SubespecialidadResponseDTO>>> listarTodas(
            @RequestParam(required = false) String estado) {
        List<SubespecialidadResponseDTO> lista = subespecialidadService.listarPorEstado(EstadoFiltro.from(estado).aActivo());
        return ResponseEntity.ok(ApiResponse.ok(lista, "Subespecialidades obtenidas"));
    }

    @GetMapping("/especialidad/{especialidadId}")
    @Operation(summary = "Listar subespecialidades por especialidad", description = "Filtra las subespecialidades de una especialidad. Filtra por estado: activos (por defecto), inactivos o todos.")
    public ResponseEntity<ApiResponse<List<SubespecialidadResponseDTO>>> listarPorEspecialidad(
            @PathVariable Long especialidadId,
            @RequestParam(required = false) String estado) {
        List<SubespecialidadResponseDTO> lista = subespecialidadService.listarPorEspecialidad(
                especialidadId, EstadoFiltro.from(estado).aActivo());
        return ResponseEntity.ok(ApiResponse.ok(lista, "Subespecialidades filtradas"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar subespecialidad por ID", description = "Obtiene los detalles de una subespecialidad.")
    public ResponseEntity<ApiResponse<SubespecialidadResponseDTO>> buscarPorId(@PathVariable Long id) {
        SubespecialidadResponseDTO response = subespecialidadService.buscarPorId(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Subespecialidad localizada"));
    }

    @PatchMapping("/{id}/reactivar")
    @Operation(summary = "Reactivar subespecialidad", description = "Vuelve a activar una subespecialidad desactivada. Falla si su especialidad padre está inactiva.")
    public ResponseEntity<ApiResponse<SubespecialidadResponseDTO>> reactivar(@PathVariable Long id) {
        SubespecialidadResponseDTO response = subespecialidadService.reactivar(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Subespecialidad reactivada exitosamente"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Desactivar subespecialidad (Soft delete)", description = "Cambia el estado de la subespecialidad a inactiva.")
    public ResponseEntity<ApiResponse<SubespecialidadResponseDTO>> desactivar(@PathVariable Long id) {
        SubespecialidadResponseDTO response = subespecialidadService.cambiarEstado(id, false);
        return ResponseEntity.ok(ApiResponse.ok(response, "Subespecialidad desactivada exitosamente"));
    }

    @GetMapping("/{id}/horarios")
    @Operation(summary = "Listar horarios (días y horas) de una subespecialidad")
    public ResponseEntity<ApiResponse<List<SubespecialidadHorarioResponseDTO>>> listarHorarios(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(
                subespecialidadHorarioService.listarPorSubespecialidad(id), "Horarios de la subespecialidad"));
    }
}
