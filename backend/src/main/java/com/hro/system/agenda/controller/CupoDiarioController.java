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
            description = "Retorna los cupos por médico y subespecialidad en un rango de fechas indicando cupos libres y ocupados.")
    public ResponseEntity<ApiResponse<List<CupoDiarioResponseDTO>>> consultarCupos(
            @Parameter(description = "ID de la subespecialidad") @RequestParam(required = false) Long subespecialidadId,
            @Parameter(description = "ID del médico") @RequestParam(required = false) Long medicoId,
            @Parameter(description = "ID de la programación médico-subespecialidad") @RequestParam(required = false) Long medicoSubespecialidadId,
            @Parameter(description = "Fecha inicial (ISO: YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @Parameter(description = "Fecha final (ISO: YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin
    ) {
        List<CupoDiarioResponseDTO> cupos = cupoDiarioService.consultarDisponibilidad(subespecialidadId, medicoId, medicoSubespecialidadId, fechaInicio, fechaFin);
        return ResponseEntity.ok(ApiResponse.ok(cupos));
    }

    @GetMapping("/medico-subespecialidad/{medicoSubespecialidadId}/fecha/{fecha}")
    @Operation(summary = "Consultar o inicializar cupo para una fecha específica")
    public ResponseEntity<ApiResponse<CupoDiarioResponseDTO>> obtenerCupoFecha(
            @PathVariable Long medicoSubespecialidadId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha
    ) {
        CupoDiario cupo = cupoDiarioService.obtenerOCrearCupoDiario(medicoSubespecialidadId, fecha);
        return ResponseEntity.ok(ApiResponse.ok(CupoDiarioResponseDTO.fromEntity(cupo)));
    }

    @PostMapping("/medico-subespecialidad/{medicoSubespecialidadId}/fecha/{fecha}/reservar")
    @Operation(summary = "Reserva atómica de un cupo (Prevención de Overbooking)",
            description = "Incrementa atómicamente los cupos ocupados si no se alcanzó la capacidad máxima. Falla con 409 si está lleno.")
    public ResponseEntity<ApiResponse<CupoDiarioResponseDTO>> reservarCupo(
            @PathVariable Long medicoSubespecialidadId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha
    ) {
        CupoDiario cupo = cupoDiarioService.reservarCupoAtomico(medicoSubespecialidadId, fecha);
        return ResponseEntity.ok(ApiResponse.ok(CupoDiarioResponseDTO.fromEntity(cupo), "Cupo reservado exitosamente de manera atómica"));
    }

    @PostMapping("/{cupoDiarioId}/liberar")
    @Operation(summary = "Liberar atómicamente un cupo previamente reservado")
    public ResponseEntity<ApiResponse<Void>> liberarCupo(@PathVariable Long cupoDiarioId) {
        cupoDiarioService.liberarCupoAtomico(cupoDiarioId);
        return ResponseEntity.ok(ApiResponse.<Void>ok(null, "Cupo liberado exitosamente"));
    }
}
