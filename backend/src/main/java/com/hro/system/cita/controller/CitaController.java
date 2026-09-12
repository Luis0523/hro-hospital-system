package com.hro.system.cita.controller;

import com.hro.system.cita.dto.CambiarEstadoCitaRequestDTO;
import com.hro.system.cita.dto.CitaHistorialResponseDTO;
import com.hro.system.cita.dto.CitaResponseDTO;
import com.hro.system.cita.dto.CrearCitaRequestDTO;
import com.hro.system.cita.service.CitaService;
import com.hro.system.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/citas")
@RequiredArgsConstructor
@Tag(name = "Citas", description = "Endpoints para agendamiento, transiciones de estado y trazabilidad de citas")
public class CitaController {

    private final CitaService citaService;

    @PostMapping
    @Operation(summary = "Agendar una nueva cita", description = "Asigna una cita consumiendo cupo de forma atómica y registrando la auditoría inicial.")
    public ResponseEntity<ApiResponse<CitaResponseDTO>> agendarCita(@Valid @RequestBody CrearCitaRequestDTO dto) {
        CitaResponseDTO response = citaService.agendarCita(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Cita agendada exitosamente"));
    }

    @PatchMapping("/{id}/estado")
    @Operation(summary = "Cambiar estado de una cita", description = "Actualiza el estado (confirmada, atendida, cancelada, etc.) con motivo de auditoría obligatorio.")
    public ResponseEntity<ApiResponse<CitaResponseDTO>> cambiarEstado(
            @PathVariable Long id,
            @Valid @RequestBody CambiarEstadoCitaRequestDTO dto) {

        CitaResponseDTO response = citaService.cambiarEstadoCita(id, dto);
        return ResponseEntity.ok(ApiResponse.ok(response, "Estado de la cita actualizado correctamente"));
    }

    @GetMapping("/paciente/{pacienteId}")
    @Operation(summary = "Listar citas de un paciente", description = "Obtiene el historial de citas asociadas a un paciente.")
    public ResponseEntity<ApiResponse<List<CitaResponseDTO>>> listarPorPaciente(@PathVariable Long pacienteId) {
        List<CitaResponseDTO> citas = citaService.listarCitasPorPaciente(pacienteId);
        return ResponseEntity.ok(ApiResponse.ok(citas, "Citas del paciente obtenidas con éxito"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener cita por ID", description = "Retorna el detalle completo de una cita médica")
    public ResponseEntity<ApiResponse<CitaResponseDTO>> obtenerPorId(@PathVariable Long id) {
        CitaResponseDTO response = citaService.obtenerPorId(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Cita obtenida exitosamente"));
    }

    @PostMapping("/{id}/reprogramar")
    @Operation(summary = "Reprogramar una cita médica", description = "Marca la cita actual como reprogramada, libera su cupo y crea una nueva cita vinculada a la original por cita_origen_id.")
    public ResponseEntity<ApiResponse<CitaResponseDTO>> reprogramarCita(
            @PathVariable Long id,
            @Valid @RequestBody com.hro.system.cita.dto.ReprogramarCitaRequestDTO dto) {
        CitaResponseDTO response = citaService.reprogramarCita(id, dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Cita reprogramada exitosamente"));
    }

    @PostMapping("/{id}/cancelar")
    @Operation(summary = "Cancelar una cita médica", description = "Cancela la cita, libera el cupo atómicamente y registra el motivo en la auditoría inmutable.")
    public ResponseEntity<ApiResponse<CitaResponseDTO>> cancelarCita(
            @PathVariable Long id,
            @Valid @RequestBody com.hro.system.cita.dto.CancelarCitaRequestDTO dto) {
        CitaResponseDTO response = citaService.cancelarCita(id, dto);
        return ResponseEntity.ok(ApiResponse.ok(response, "Cita cancelada y cupo liberado exitosamente"));
    }

    @PostMapping("/cierre-diario")
    @Operation(summary = "Ejecutar cierre diario de jornada", description = "Identifica citas pendientes en la fecha que no asistieron y las marca como no_asistio sin liberar cupos.")
    public ResponseEntity<ApiResponse<Integer>> ejecutarCierreDiario(
            @Valid @RequestBody com.hro.system.cita.dto.CierreDiarioRequestDTO dto) {
        int procesadas = citaService.ejecutarCierreDiario(dto.getFecha(), dto.getClinicaId(), dto.getUsuarioId());
        return ResponseEntity.ok(ApiResponse.ok(procesadas, "Cierre diario ejecutado exitosamente. Citas marcadas como no_asistio: " + procesadas));
    }

    @GetMapping("/{id}/historial")
    @Operation(summary = "Consultar trazabilidad de una cita", description = "Retorna el historial completo de cambios de estado y usuarios que los realizaron.")
    public ResponseEntity<ApiResponse<List<CitaHistorialResponseDTO>>> obtenerHistorial(@PathVariable Long id) {
        List<CitaHistorialResponseDTO> historial = citaService.obtenerHistorialCita(id);
        return ResponseEntity.ok(ApiResponse.ok(historial, "Historial de trazabilidad obtenido exitosamente"));
    }
}
