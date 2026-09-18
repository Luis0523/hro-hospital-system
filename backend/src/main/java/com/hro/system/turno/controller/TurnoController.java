package com.hro.system.turno.controller;

import com.hro.system.cita.dto.CierreDiarioRequestDTO;
import com.hro.system.common.ApiResponse;
import com.hro.system.turno.dto.GenerarTurnoRequestDTO;
import com.hro.system.turno.dto.ReintegrarTurnoRequestDTO;
import com.hro.system.turno.dto.TurnoResponseDTO;
import com.hro.system.turno.service.TurnoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
@Tag(name = "Turnos", description = "Check-in de enfermería, llamadas, no-responde, reintegración y tablero")
public class TurnoController {

    private final TurnoService turnoService;

    @PostMapping({"/check-in", "/generar"})
    @Operation(summary = "Check-in de enfermería (Generar turno)",
            description = "Confirma la llegada física, resuelve la sala del día y obtiene el correlativo atómico (fn_siguiente_turno).")
    public ResponseEntity<ApiResponse<TurnoResponseDTO>> generarTurno(@Valid @RequestBody GenerarTurnoRequestDTO dto) {
        TurnoResponseDTO response = turnoService.generarTurnoParaCita(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Check-in registrado exitosamente y paciente agregado a la fila de espera"));
    }

    @PostMapping("/{id}/llamar")
    @Operation(summary = "Llamar paciente al consultorio")
    public ResponseEntity<ApiResponse<TurnoResponseDTO>> llamarTurno(
            @PathVariable Long id,
            @Parameter(description = "ID del usuario. Opcional: si se omite, se toma del usuario autenticado.") @RequestParam(required = false) Long usuarioId) {
        return ResponseEntity.ok(ApiResponse.ok(turnoService.llamarTurno(id, usuarioId), "Turno llamado exitosamente"));
    }

    @PostMapping("/{id}/no-responde")
    @Operation(summary = "Marcar turno como 'no_responde'")
    public ResponseEntity<ApiResponse<TurnoResponseDTO>> marcarNoResponde(
            @PathVariable Long id,
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) String motivo) {
        return ResponseEntity.ok(ApiResponse.ok(turnoService.marcarNoResponde(id, usuarioId, motivo), "Turno marcado como 'no_responde'"));
    }

    @PostMapping("/{id}/reintegrar")
    @Operation(summary = "Reintegrar paciente a la fila el mismo día")
    public ResponseEntity<ApiResponse<TurnoResponseDTO>> reintegrarTurno(
            @PathVariable Long id,
            @Valid @RequestBody ReintegrarTurnoRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(turnoService.reintegrarTurno(id, dto), "Paciente reintegrado al final de la fila exitosamente"));
    }

    @PostMapping("/{id}/atendido")
    @Operation(summary = "Marcar turno como 'atendido'")
    public ResponseEntity<ApiResponse<TurnoResponseDTO>> marcarAtendido(
            @PathVariable Long id,
            @RequestParam(required = false) Long usuarioId) {
        return ResponseEntity.ok(ApiResponse.ok(turnoService.marcarAtendido(id, usuarioId), "Consulta finalizada y turno marcado como 'atendido'"));
    }

    @PostMapping("/cierre-diario")
    @Operation(summary = "Cierre diario de turnos no respondidos")
    public ResponseEntity<ApiResponse<Integer>> cierreDiarioTurnos(@Valid @RequestBody CierreDiarioRequestDTO dto) {
        int total = turnoService.procesarCierreDiarioTurnosNoRespondidos(dto.getFecha(), dto.getSubespecialidadId(), dto.getUsuarioId());
        return ResponseEntity.ok(ApiResponse.ok(total, "Cierre de turnos procesado exitosamente. Turnos marcados como no_asistio: " + total));
    }

    @GetMapping("/asignacion/{asignacionDiariaEspacioId}")
    @Operation(summary = "Listar turnos en espera por asignación diaria (sala + subespecialidad del día)")
    public ResponseEntity<ApiResponse<List<TurnoResponseDTO>>> listarPorAsignacion(@PathVariable Long asignacionDiariaEspacioId) {
        return ResponseEntity.ok(ApiResponse.ok(turnoService.listarTurnosEnEspera(asignacionDiariaEspacioId), "Turnos en espera obtenidos con éxito"));
    }

    @GetMapping("/activos")
    @Operation(summary = "Listar turnos en espera globales")
    public ResponseEntity<ApiResponse<List<TurnoResponseDTO>>> listarActivos() {
        return ResponseEntity.ok(ApiResponse.ok(turnoService.listarTurnosActivos(), "Turnos activos listados con éxito"));
    }
}
