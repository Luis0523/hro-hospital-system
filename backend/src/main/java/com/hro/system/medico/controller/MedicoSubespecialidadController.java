package com.hro.system.medico.controller;

import com.hro.system.common.ApiResponse;
import com.hro.system.medico.dto.AsignarMedicoSubespecialidadRequestDTO;
import com.hro.system.medico.dto.MedicoSubespecialidadResponseDTO;
import com.hro.system.medico.service.MedicoSubespecialidadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/medico-subespecialidades")
@RequiredArgsConstructor
@Tag(name = "Programación Médica", description = "Horarios y capacidad del médico por subespecialidad (independiente de la sala física)")
public class MedicoSubespecialidadController {

    private final MedicoSubespecialidadService medicoSubespecialidadService;

    @PostMapping
    @Operation(summary = "Asignar horario y cupo a médico en subespecialidad",
            description = "Día de la semana (1=Lun ... 7=Dom), horas, duración de consulta y capacidad máxima.")
    public ResponseEntity<ApiResponse<MedicoSubespecialidadResponseDTO>> asignar(@Valid @RequestBody AsignarMedicoSubespecialidadRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(medicoSubespecialidadService.asignarHorario(dto), "Horario y cupo asignado exitosamente"));
    }

    @GetMapping("/subespecialidad/{subespecialidadId}")
    @Operation(summary = "Listar horarios por subespecialidad")
    public ResponseEntity<ApiResponse<List<MedicoSubespecialidadResponseDTO>>> listarPorSubespecialidad(@PathVariable Long subespecialidadId) {
        return ResponseEntity.ok(ApiResponse.ok(medicoSubespecialidadService.listarPorSubespecialidad(subespecialidadId), "Horarios de la subespecialidad"));
    }

    @GetMapping("/medico/{medicoId}")
    @Operation(summary = "Listar asignaciones de un médico")
    public ResponseEntity<ApiResponse<List<MedicoSubespecialidadResponseDTO>>> listarPorMedico(@PathVariable UUID medicoId) {
        return ResponseEntity.ok(ApiResponse.ok(medicoSubespecialidadService.listarPorMedico(medicoId), "Asignaciones del médico"));
    }

    @GetMapping("/subespecialidad/{subespecialidadId}/dia/{diaSemana}")
    @Operation(summary = "Listar médicos por subespecialidad y día")
    public ResponseEntity<ApiResponse<List<MedicoSubespecialidadResponseDTO>>> listarPorDia(
            @PathVariable Long subespecialidadId,
            @Parameter(description = "1 = Lunes ... 7 = Domingo") @PathVariable Short diaSemana) {
        return ResponseEntity.ok(ApiResponse.ok(medicoSubespecialidadService.listarPorSubespecialidadYDia(subespecialidadId, diaSemana), "Médicos para el día seleccionado"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar asignación por ID")
    public ResponseEntity<ApiResponse<MedicoSubespecialidadResponseDTO>> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(medicoSubespecialidadService.buscarPorId(id), "Asignación localizada"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Desactivar horario (soft delete)")
    public ResponseEntity<ApiResponse<Void>> desactivar(@PathVariable UUID id) {
        medicoSubespecialidadService.cambiarEstado(id, false);
        return ResponseEntity.ok(ApiResponse.ok(null, "Horario desactivado"));
    }
}
