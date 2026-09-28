package com.hro.system.clinica.controller;

import com.hro.system.clinica.dto.SubespecialidadHorarioRequestDTO;
import com.hro.system.clinica.dto.SubespecialidadHorarioResponseDTO;
import com.hro.system.clinica.service.SubespecialidadHorarioService;
import com.hro.system.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/subespecialidad-horarios")
@RequiredArgsConstructor
@Tag(name = "Horario por Subespecialidad", description = "Días y horas de atención por subespecialidad (sin médico)")
public class SubespecialidadHorarioController {

    private final SubespecialidadHorarioService horarioService;

    @PostMapping
    @PreAuthorize("hasAnyRole('jefe_enfermeria', 'administrador')")
    @Operation(summary = "Crear horario de subespecialidad", description = "Día de la semana (1=Lun..7=Dom), horas, capacidad y duración. Único por subespecialidad+día.")
    public ResponseEntity<ApiResponse<SubespecialidadHorarioResponseDTO>> crear(@Valid @RequestBody SubespecialidadHorarioRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(horarioService.crear(dto), "Horario creado exitosamente"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar horario por ID")
    public ResponseEntity<ApiResponse<SubespecialidadHorarioResponseDTO>> buscar(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(horarioService.buscarPorId(id), "Horario localizado"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('jefe_enfermeria', 'administrador')")
    @Operation(summary = "Actualizar horario de subespecialidad")
    public ResponseEntity<ApiResponse<SubespecialidadHorarioResponseDTO>> actualizar(
            @PathVariable UUID id, @Valid @RequestBody SubespecialidadHorarioRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(horarioService.actualizar(id, dto), "Horario actualizado"));
    }

    @PatchMapping("/{id}/reactivar")
    @PreAuthorize("hasAnyRole('jefe_enfermeria', 'administrador')")
    @Operation(summary = "Reactivar horario (idempotente)")
    public ResponseEntity<ApiResponse<SubespecialidadHorarioResponseDTO>> reactivar(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(horarioService.reactivar(id), "Horario reactivado"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('jefe_enfermeria', 'administrador')")
    @Operation(summary = "Desactivar horario (baja lógica)")
    public ResponseEntity<ApiResponse<SubespecialidadHorarioResponseDTO>> desactivar(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(horarioService.desactivar(id), "Horario desactivado"));
    }
}
