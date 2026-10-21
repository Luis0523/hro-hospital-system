package com.hro.system.tablero.controller;

import com.hro.system.common.ApiResponse;
import com.hro.system.estacion.dto.EstacionResponseDTO;
import com.hro.system.estacion.service.EstacionService;
import com.hro.system.turno.dto.TableroTurnoDTO;
import com.hro.system.turno.service.TurnoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Datos de solo lectura para las pantallas/TV del tablero.
 * No requieren sesión porque la TV no tiene usuario interactuando.
 * Se omiten datos personales del paciente.
 */
@RestController
@RequestMapping("/publico/tablero")
@RequiredArgsConstructor
@Tag(name = "Tablero público", description = "Catálogo y estado inicial del tablero para pantallas sin sesión")
public class TableroPublicoController {

    private final EstacionService estacionService;
    private final TurnoService turnoService;

    @GetMapping("/estaciones")
    @Operation(summary = "Listar estaciones activas para el tablero")
    public ResponseEntity<ApiResponse<List<EstacionResponseDTO>>> estaciones() {
        return ResponseEntity.ok(ApiResponse.ok(
                estacionService.listar(true), "Estaciones del tablero"));
    }

    @GetMapping("/estaciones/{id}/tablero")
    @Operation(summary = "Estado inicial del tablero de una estación")
    public ResponseEntity<ApiResponse<List<TableroTurnoDTO>>> tablero(
            @PathVariable Long id,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        List<TableroTurnoDTO> tablero = turnoService.obtenerTableroEstacion(id, fecha).stream()
                .map(this::sinDatosPaciente)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(tablero, "Estado del tablero"));
    }

    private TableroTurnoDTO sinDatosPaciente(TableroTurnoDTO dto) {
        dto.setPacienteNombre(null);
        dto.setPorNombre(false);
        return dto;
    }
}
