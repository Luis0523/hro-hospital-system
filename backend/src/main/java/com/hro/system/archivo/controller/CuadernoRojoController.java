package com.hro.system.archivo.controller;

import com.hro.system.archivo.dto.CuadernoRojoResponseDTO;
import com.hro.system.archivo.dto.GuardarCuadernoRojoRequestDTO;
import com.hro.system.archivo.service.CuadernoRojoService;
import com.hro.system.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Registro diario manual del Cuaderno Rojo del Departamento de Archivo.
 * No depende de otros módulos; se captura una fila por fecha.
 */
@RestController
@RequestMapping("/cuaderno-rojo")
@RequiredArgsConstructor
@Tag(name = "Cuaderno Rojo",
        description = "Registro diario manual del Cuaderno Rojo de Archivo")
public class CuadernoRojoController {

    private final CuadernoRojoService service;

    @GetMapping
    @Operation(summary = "Listar registros del Cuaderno Rojo",
            description = "Sin filtros devuelve todos los registros; con año y/o mes filtra el período.")
    public ResponseEntity<ApiResponse<List<CuadernoRojoResponseDTO>>> listar(
            @RequestParam(required = false) Integer anio,
            @RequestParam(required = false) Integer mes) {
        return ResponseEntity.ok(ApiResponse.ok(
                service.listar(anio, mes), "Registros del Cuaderno Rojo obtenidos"));
    }

    @GetMapping("/{fecha}")
    @Operation(summary = "Consultar el registro de una fecha")
    public ResponseEntity<ApiResponse<CuadernoRojoResponseDTO>> buscar(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(ApiResponse.ok(
                service.buscarPorFecha(fecha).orElse(null), "Consulta realizada"));
    }

    @PutMapping("/{fecha}")
    @PreAuthorize("hasAnyRole('archivo', 'administrador')")
    @Operation(summary = "Guardar (crear o actualizar) el registro de una fecha",
            description = "Si la fecha ya existe, actualiza sus cantidades; no crea duplicados.")
    public ResponseEntity<ApiResponse<CuadernoRojoResponseDTO>> guardar(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @Valid @RequestBody GuardarCuadernoRojoRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(
                service.guardar(fecha, dto), "Registro del Cuaderno Rojo guardado"));
    }
}
