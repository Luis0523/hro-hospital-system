package com.hro.system.archivo.controller;

import com.hro.system.archivo.dto.DepurarExpedienteRequestDTO;
import com.hro.system.archivo.dto.ExpedienteDepuradoResponseDTO;
import com.hro.system.archivo.service.DepuracionArchivoService;
import com.hro.system.common.ApiResponse;
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
 * Depuración de expedientes. La ruta literal {@code /expedientes/depuracion}
 * convive con {@code /expedientes/{id}} del {@link ExpedienteController} porque
 * Spring prioriza la ruta literal sobre la plantilla.
 */
@RestController
@RequestMapping("/expedientes/depuracion")
@RequiredArgsConstructor
@Tag(name = "Archivo - Depuración", description = "Baja lógica de expedientes (ya no existe en el sistema)")
public class DepuracionArchivoController {

    private final DepuracionArchivoService depuracionService;

    @PostMapping
    @Operation(summary = "Depurar expediente",
            description = "Marca un expediente como depurado (baja lógica) por su número. 404 si no existe; 409 si ya estaba depurado.")
    public ResponseEntity<ApiResponse<ExpedienteDepuradoResponseDTO>> depurar(
            @Valid @RequestBody DepurarExpedienteRequestDTO dto) {
        ExpedienteDepuradoResponseDTO response = depuracionService.depurar(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Expediente depurado exitosamente"));
    }

    @GetMapping
    @Operation(summary = "Bitácora de depuración del día",
            description = "Expedientes depurados en una fecha (por defecto hoy), más recientes primero.")
    public ResponseEntity<ApiResponse<List<ExpedienteDepuradoResponseDTO>>> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(ApiResponse.ok(
                depuracionService.listarPorFecha(fecha), "Depuraciones obtenidas"));
    }
}
