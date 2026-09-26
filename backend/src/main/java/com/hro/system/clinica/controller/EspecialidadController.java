package com.hro.system.clinica.controller;

import com.hro.system.common.ApiResponse;
import com.hro.system.common.EstadoFiltro;
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
    @Operation(summary = "Listar especialidades", description = "Retorna el listado de especialidades. Filtra por estado: activos (por defecto), inactivos o todos.")
    public ResponseEntity<ApiResponse<List<EspecialidadResponseDTO>>> listar(
            @RequestParam(required = false) String estado) {
        List<EspecialidadResponseDTO> lista = especialidadService.listarPorEstado(EstadoFiltro.from(estado).aActivo());
        return ResponseEntity.ok(ApiResponse.ok(lista, "Especialidades obtenidas"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar especialidad por ID", description = "Obtiene los detalles de una especialidad.")
    public ResponseEntity<ApiResponse<EspecialidadResponseDTO>> buscarPorId(@PathVariable Long id) {
        EspecialidadResponseDTO response = especialidadService.buscarPorId(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Especialidad localizada"));
    }

    @PatchMapping("/{id}/reactivar")
    @Operation(summary = "Reactivar especialidad", description = "Vuelve a activar una especialidad previamente desactivada (baja lógica).")
    public ResponseEntity<ApiResponse<EspecialidadResponseDTO>> reactivar(@PathVariable Long id) {
        EspecialidadResponseDTO response = especialidadService.reactivar(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Especialidad reactivada exitosamente"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Desactivar especialidad (Soft delete)", description = "Cambia el estado de la especialidad a inactiva.")
    public ResponseEntity<ApiResponse<EspecialidadResponseDTO>> desactivar(@PathVariable Long id) {
        EspecialidadResponseDTO response = especialidadService.cambiarEstado(id, false);
        return ResponseEntity.ok(ApiResponse.ok(response, "Especialidad desactivada exitosamente"));
    }
}
