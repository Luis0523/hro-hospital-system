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

    @GetMapping("/{id}/historial")
    @Operation(summary = "Consultar trazabilidad de una cita", description = "Retorna el historial completo de cambios de estado y usuarios que los realizaron.")
    public ResponseEntity<ApiResponse<List<CitaHistorialResponseDTO>>> obtenerHistorial(@PathVariable Long id) {
        List<CitaHistorialResponseDTO> historial = citaService.obtenerHistorialCita(id);
        return ResponseEntity.ok(ApiResponse.ok(historial, "Historial de trazabilidad obtenido exitosamente"));
    }
}
