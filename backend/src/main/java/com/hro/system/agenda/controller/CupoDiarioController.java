package com.hro.system.agenda.controller;

import com.hro.system.agenda.dto.CupoDiarioResponseDTO;
import com.hro.system.agenda.entity.CupoDiario;
import com.hro.system.agenda.service.CupoDiarioService;
import com.hro.system.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/cupos")
@RequiredArgsConstructor
@Tag(name = "Cupos Diarios", description = "Control atómico y concurrente de disponibilidad y capacidad de citas")
public class CupoDiarioController {

    private final CupoDiarioService cupoDiarioService;

    @GetMapping
    @Operation(summary = "Consultar disponibilidad de cupos en un rango de fechas",
            description = "Retorna la lista de cupos por médico y clínica en un rango de fechas indicando cupos libres y ocupados.")
    public ResponseEntity<ApiResponse<List<CupoDiarioResponseDTO>>> consultarCupos(
            @Parameter(description = "ID de la clínica") @RequestParam(required = false) Long clinicaId,
            @Parameter(description = "ID del médico") @RequestParam(required = false) Long medicoId,
            @Parameter(description = "ID de la asignación médico-clínica") @RequestParam(required = false) Long medicoClinicaId,
            @Parameter(description = "Fecha inicial (ISO: YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @Parameter(description = "Fecha final (ISO: YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin
    ) {
        List<CupoDiarioResponseDTO> cupos = cupoDiarioService.consultarDisponibilidad(clinicaId, medicoId, medicoClinicaId, fechaInicio, fechaFin);
        return ResponseEntity.ok(ApiResponse.ok(cupos));
    }

    @GetMapping("/medico-clinica/{medicoClinicaId}/fecha/{fecha}")
    @Operation(summary = "Consultar o inicializar cupo para una fecha específica",
            description = "Obtiene los datos de capacidad y cupos ocupados para un horario y fecha específicos.")
    public ResponseEntity<ApiResponse<CupoDiarioResponseDTO>> obtenerCupoFecha(
            @PathVariable Long medicoClinicaId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha
    ) {
        CupoDiario cupo = cupoDiarioService.obtenerOCrearCupoDiario(medicoClinicaId, fecha);
        return ResponseEntity.ok(ApiResponse.ok(CupoDiarioResponseDTO.fromEntity(cupo)));
    }

    @PostMapping("/medico-clinica/{medicoClinicaId}/fecha/{fecha}/reservar")
    @Operation(summary = "Reserva atómica de un cupo (Prevención de Overbooking)",
            description = "Incrementa de forma atómica e indivisible los cupos ocupados si no se ha alcanzado la capacidad máxima. Falla con 409 Conflict si está lleno.")
    public ResponseEntity<ApiResponse<CupoDiarioResponseDTO>> reservarCupo(
            @PathVariable Long medicoClinicaId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha
    ) {
        CupoDiario cupo = cupoDiarioService.reservarCupoAtomico(medicoClinicaId, fecha);
        return ResponseEntity.ok(ApiResponse.ok(CupoDiarioResponseDTO.fromEntity(cupo), "Cupo reservado exitosamente de manera atómica"));
    }

    @PostMapping("/{cupoDiarioId}/liberar")
    @Operation(summary = "Liberar atómicamente un cupo previamente reservado",
            description = "Decrementa de forma segura el contador de cupos ocupados.")
    public ResponseEntity<ApiResponse<Void>> liberarCupo(@PathVariable Long cupoDiarioId) {
        cupoDiarioService.liberarCupoAtomico(cupoDiarioId);
        return ResponseEntity.ok(ApiResponse.<Void>ok(null, "Cupo liberado exitosamente"));
    }
}
