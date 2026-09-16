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
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/turnos")
@RequiredArgsConstructor
@Tag(name = "Turnos", description = "Endpoints para check-in de enfermería, llamadas, no-responde, reintegración y tablero")
public class TurnoController {

    private final TurnoService turnoService;

    @PostMapping({"/check-in", "/generar"})
    @Operation(summary = "Check-in de enfermería (Generar turno)",
            description = "Confirma la llegada física del paciente, obtiene el correlativo atómico del día (fn_siguiente_turno), pasa la cita a confirmada y actualiza el tablero.")
    public ResponseEntity<ApiResponse<TurnoResponseDTO>> generarTurno(@Valid @RequestBody GenerarTurnoRequestDTO dto) {
        TurnoResponseDTO response = turnoService.generarTurnoParaCita(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Check-in registrado exitosamente y paciente agregado a la fila de espera"));
    }

    @PostMapping("/{id}/llamar")
    @Operation(summary = "Llamar paciente al consultorio",
            description = "Pasa el estado a 'llamado', incrementa intentos, actualiza turno actual en el tablero e inicia el tiempo de gracia configurable.")
    public ResponseEntity<ApiResponse<TurnoResponseDTO>> llamarTurno(
            @PathVariable Long id,
            @Parameter(description = "ID del médico o enfermera que realiza el llamado") @RequestParam Long usuarioId) {
        TurnoResponseDTO response = turnoService.llamarTurno(id, usuarioId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Turno llamado exitosamente"));
    }

    @PostMapping("/{id}/no-responde")
    @Operation(summary = "Marcar turno como 'no_responde'",
            description = "Se activa si expira el tiempo de gracia sin que el paciente se presente. Permite avanzar la fila inmediatamente sin bloquear.")
    public ResponseEntity<ApiResponse<TurnoResponseDTO>> marcarNoResponde(
            @PathVariable Long id,
            @RequestParam Long usuarioId,
            @RequestParam(required = false) String motivo) {
        TurnoResponseDTO response = turnoService.marcarNoResponde(id, usuarioId, motivo);
        return ResponseEntity.ok(ApiResponse.ok(response, "Turno marcado como 'no_responde'"));
    }

    @PostMapping("/{id}/reintegrar")
    @Operation(summary = "Reintegrar paciente a la fila el mismo día",
            description = "Si un paciente en 'no_responde' regresa más tarde el mismo día, se reasigna al final de la fila actual (nuevo correlativo) conservando la misma cita original.")
    public ResponseEntity<ApiResponse<TurnoResponseDTO>> reintegrarTurno(
            @PathVariable Long id,
            @Valid @RequestBody ReintegrarTurnoRequestDTO dto) {
        TurnoResponseDTO response = turnoService.reintegrarTurno(id, dto);
        return ResponseEntity.ok(ApiResponse.ok(response, "Paciente reintegrado al final de la fila exitosamente"));
    }

    @PostMapping("/{id}/atendido")
    @Operation(summary = "Marcar turno como 'atendido'",
            description = "Concluye la atención médica y actualiza la cita asociada al estado 'atendida' con auditoría obligatoria.")
    public ResponseEntity<ApiResponse<TurnoResponseDTO>> marcarAtendido(
            @PathVariable Long id,
            @RequestParam Long usuarioId) {
        TurnoResponseDTO response = turnoService.marcarAtendido(id, usuarioId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Consulta finalizada y turno marcado como 'atendido'"));
    }

    @PostMapping("/cierre-diario")
    @Operation(summary = "Cierre diario de turnos no respondidos",
            description = "Marca como 'no_asistio' todas las citas cuyos turnos quedaron en 'no_responde' sin liberar cupo.")
    public ResponseEntity<ApiResponse<Integer>> cierreDiarioTurnos(
            @Valid @RequestBody CierreDiarioRequestDTO dto) {
        int total = turnoService.procesarCierreDiarioTurnosNoRespondidos(dto.getFecha(), dto.getClinicaId(), dto.getUsuarioId());
        return ResponseEntity.ok(ApiResponse.ok(total, "Cierre de turnos procesado exitosamente. Turnos marcados como no_asistio: " + total));
    }

    @GetMapping("/clinica/{clinicaId}")
    @Operation(summary = "Listar turnos en espera por clínica",
            description = "Obtiene la fila activa de pacientes para una clínica en una fecha determinada.")
    public ResponseEntity<ApiResponse<List<TurnoResponseDTO>>> listarPorClinica(
            @PathVariable Long clinicaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        List<TurnoResponseDTO> turnos = turnoService.listarTurnosEnEspera(clinicaId, fecha);
        return ResponseEntity.ok(ApiResponse.ok(turnos, "Turnos en espera obtenidos con éxito"));
    }

    @GetMapping("/activos")
    @Operation(summary = "Listar turnos en espera globales",
            description = "Obtiene todos los turnos actualmente en espera en el hospital.")
    public ResponseEntity<ApiResponse<List<TurnoResponseDTO>>> listarActivos() {
        List<TurnoResponseDTO> activos = turnoService.listarTurnosActivos();
        return ResponseEntity.ok(ApiResponse.ok(activos, "Turnos activos listados con éxito"));
    }
}
