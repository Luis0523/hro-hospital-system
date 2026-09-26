package com.hro.system.usuario.controller;

import com.hro.system.common.ApiResponse;
import com.hro.system.common.EstadoFiltro;
import com.hro.system.usuario.dto.CrearPermisoRequestDTO;
import com.hro.system.usuario.dto.PermisoSubespecialidadResponseDTO;
import com.hro.system.usuario.service.PermisoSubespecialidadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/permisos-subespecialidad")
@RequiredArgsConstructor
@Tag(name = "Permisos por Subespecialidad (Admin)",
        description = "Asignación, baja lógica y reactivación de permisos de usuario sobre subespecialidades")
public class PermisoSubespecialidadController {

    private final PermisoSubespecialidadService permisoSubespecialidadService;

    @GetMapping
    @Operation(summary = "Listar permisos",
            description = "Filtros opcionales: subespecialidadId y estado (activos por defecto; inactivos; todos).")
    public ResponseEntity<ApiResponse<List<PermisoSubespecialidadResponseDTO>>> listar(
            @RequestParam(required = false) Long subespecialidadId,
            @RequestParam(required = false) String estado) {
        return ResponseEntity.ok(ApiResponse.ok(
                permisoSubespecialidadService.listar(subespecialidadId, EstadoFiltro.from(estado).aActivo()),
                "Permisos obtenidos"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar permiso por ID")
    public ResponseEntity<ApiResponse<PermisoSubespecialidadResponseDTO>> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(permisoSubespecialidadService.buscarPorId(id), "Permiso localizado"));
    }

    @PostMapping
    @Operation(summary = "Asignar permiso",
            description = "Crea el permiso usuario + subespecialidad + tipo. Si existía inactivo, lo reactiva.")
    public ResponseEntity<ApiResponse<PermisoSubespecialidadResponseDTO>> asignar(
            @Valid @RequestBody CrearPermisoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(permisoSubespecialidadService.asignar(dto), "Permiso asignado"));
    }

    @PatchMapping("/{id}/desactivar")
    @Operation(summary = "Desactivar permiso (baja lógica)")
    public ResponseEntity<ApiResponse<PermisoSubespecialidadResponseDTO>> desactivar(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(permisoSubespecialidadService.desactivar(id), "Permiso desactivado"));
    }

    @PatchMapping("/{id}/reactivar")
    @Operation(summary = "Reactivar permiso",
            description = "Reactiva un permiso desactivado. Falla si el usuario o la subespecialidad están inactivos.")
    public ResponseEntity<ApiResponse<PermisoSubespecialidadResponseDTO>> reactivar(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(permisoSubespecialidadService.activar(id), "Permiso reactivado"));
    }
}
