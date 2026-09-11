package com.hro.system.agenda.controller;

import com.hro.system.agenda.dto.CrearDiaNoLaborableRequestDTO;
import com.hro.system.agenda.dto.DiaNoLaborableResponseDTO;
import com.hro.system.agenda.service.DiaNoLaborableService;
import com.hro.system.common.ApiResponse;
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
@RequestMapping("/dias-no-laborables")
@RequiredArgsConstructor
@Tag(name = "Calendario Institucional", description = "Endpoints para gestión de feriados, asuetos y días no laborables con validación de citas previas")
public class DiaNoLaborableController {

    private final DiaNoLaborableService diaNoLaborableService;

    @PostMapping
    @Operation(summary = "Registrar día no laborable", 
               description = "Bloquea una fecha en el calendario institucional. Valida previamente que no existan citas agendadas en dicha fecha.")
    public ResponseEntity<ApiResponse<DiaNoLaborableResponseDTO>> registrar(@Valid @RequestBody CrearDiaNoLaborableRequestDTO dto) {
        DiaNoLaborableResponseDTO response = diaNoLaborableService.registrarDiaNoLaborable(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Día no laborable registrado exitosamente"));
    }

    @GetMapping
    @Operation(summary = "Listar todos los días no laborables", description = "Obtiene el calendario institucional completo de días no laborables.")
    public ResponseEntity<ApiResponse<List<DiaNoLaborableResponseDTO>>> listarTodos() {
        List<DiaNoLaborableResponseDTO> lista = diaNoLaborableService.listarTodos();
        return ResponseEntity.ok(ApiResponse.ok(lista, "Días no laborables obtenidos"));
    }

    @GetMapping("/futuros")
    @Operation(summary = "Listar próximos días no laborables", description = "Retorna los feriados y asuetos a partir de la fecha actual.")
    public ResponseEntity<ApiResponse<List<DiaNoLaborableResponseDTO>>> listarFuturos() {
        List<DiaNoLaborableResponseDTO> lista = diaNoLaborableService.listarFuturos();
        return ResponseEntity.ok(ApiResponse.ok(lista, "Próximos días no laborables obtenidos"));
    }

    @GetMapping("/rango")
    @Operation(summary = "Consultar días no laborables en un rango", description = "Filtra los asuetos entre dos fechas (útil para vistas mensuales del calendario).")
    public ResponseEntity<ApiResponse<List<DiaNoLaborableResponseDTO>>> listarPorRango(
            @Parameter(description = "Fecha inicial (YYYY-MM-DD)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @Parameter(description = "Fecha final (YYYY-MM-DD)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        List<DiaNoLaborableResponseDTO> lista = diaNoLaborableService.listarPorRango(inicio, fin);
        return ResponseEntity.ok(ApiResponse.ok(lista, "Días no laborables en el rango obtenido"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar día no laborable", description = "Habilita nuevamente la fecha para programación médica.")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Long id) {
        diaNoLaborableService.eliminarDiaNoLaborable(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Día no laborable eliminado exitosamente"));
    }
}
