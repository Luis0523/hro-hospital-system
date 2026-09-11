package com.hro.system.turno.controller;

import com.hro.system.common.ApiResponse;
import com.hro.system.turno.dto.GenerarTurnoRequestDTO;
import com.hro.system.turno.dto.TurnoResponseDTO;
import com.hro.system.turno.service.TurnoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/turnos")
@RequiredArgsConstructor
@Tag(name = "Turnos", description = "Endpoints para generación de turnos, avance de cola y control de llamadas")
public class TurnoController {

    private final TurnoService turnoService;

    @PostMapping("/generar")
    @Operation(summary = "Generar turno de atención", description = "Enfermería registra la llegada del paciente, genera el correlativo atómico y actualiza la cola en tiempo real.")
    public ResponseEntity<ApiResponse<TurnoResponseDTO>> generarTurno(@Valid @RequestBody GenerarTurnoRequestDTO dto) {
        TurnoResponseDTO response = turnoService.generarTurnoParaCita(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Turno generado y paciente agregado a la cola"));
    }

    @PatchMapping("/{id}/avanzar")
    @Operation(summary = "Avanzar estado del turno", description = "Permite cambiar el estado (llamado, atendido, no_responde, reintegrado) y actualiza las pantallas.")
    public ResponseEntity<ApiResponse<TurnoResponseDTO>> avanzarTurno(
            @PathVariable Long id,
            @RequestParam String nuevoEstado,
            @RequestParam Long usuarioId) {

        TurnoResponseDTO response = turnoService.avanzarTurno(id, nuevoEstado, usuarioId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Estado del turno actualizado"));
    }

    @GetMapping("/activos")
    @Operation(summary = "Listar turnos en espera", description = "Obtiene los turnos actualmente en espera en las salas de consulta externa.")
    public ResponseEntity<ApiResponse<List<TurnoResponseDTO>>> listarActivos() {
        List<TurnoResponseDTO> activos = turnoService.listarTurnosActivos();
        return ResponseEntity.ok(ApiResponse.ok(activos, "Turnos activos listados con éxito"));
    }
}
