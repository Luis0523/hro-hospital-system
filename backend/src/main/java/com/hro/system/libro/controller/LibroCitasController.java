package com.hro.system.libro.controller;

import com.hro.system.common.ApiResponse;
import com.hro.system.libro.dto.ExpedientesEsperadosDTO;
import com.hro.system.libro.dto.LibroCitasDiaRequestDTO;
import com.hro.system.libro.dto.LibroCitasDiaResponseDTO;
import com.hro.system.libro.service.LibroCitasService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Digitalización del libro físico de citas (contadores diarios y desglose por subespecialidad).
 */
@RestController
@RequestMapping("/libro-citas")
@RequiredArgsConstructor
@Tag(name = "Libro de citas", description = "Registro diario del libro físico de citas (digitalización)")
public class LibroCitasController {

    private final LibroCitasService libroCitasService;

    @GetMapping
    @Operation(summary = "Listar registros del libro", description = "Lista los registros del libro en un rango de fechas (opcional).")
    public ResponseEntity<ApiResponse<List<LibroCitasDiaResponseDTO>>> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        return ResponseEntity.ok(ApiResponse.ok(libroCitasService.listar(inicio, fin), "Registros del libro obtenidos"));
    }

    @GetMapping("/esperado")
    @Operation(summary = "Expedientes esperados por fecha",
            description = "Número de expedientes esperados para una fecha, desglosado por subespecialidad. Fase 1: fuente = libro digitado.")
    public ResponseEntity<ApiResponse<ExpedientesEsperadosDTO>> esperado(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(ApiResponse.ok(libroCitasService.esperados(fecha), "Expedientes esperados obtenidos"));
    }

    @GetMapping("/{fecha}")
    @Operation(summary = "Obtener el registro de una fecha", description = "Devuelve el registro del libro para la fecha indicada.")
    public ResponseEntity<ApiResponse<LibroCitasDiaResponseDTO>> obtener(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(ApiResponse.ok(libroCitasService.obtenerPorFecha(fecha), "Registro del libro obtenido"));
    }

    @PostMapping
    @Operation(summary = "Registrar el libro de un día", description = "Crea el registro del libro para una fecha. 409 si la fecha ya existe.")
    public ResponseEntity<ApiResponse<LibroCitasDiaResponseDTO>> crear(@Valid @RequestBody LibroCitasDiaRequestDTO dto) {
        LibroCitasDiaResponseDTO response = libroCitasService.crear(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Registro del libro creado exitosamente"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar el registro de un día", description = "Actualiza contadores, observaciones y desglose por subespecialidad.")
    public ResponseEntity<ApiResponse<LibroCitasDiaResponseDTO>> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody LibroCitasDiaRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(libroCitasService.actualizar(id, dto), "Registro del libro actualizado"));
    }
}
