package com.hro.system.archivo.controller;

import com.hro.system.archivo.dto.CrearUbicacionArchivoRequestDTO;
import com.hro.system.archivo.dto.UbicacionArchivoResponseDTO;
import com.hro.system.archivo.service.ArchivoService;
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
@RequestMapping("/ubicaciones-archivo")
@RequiredArgsConstructor
@Tag(name = "Archivo - Ubicaciones", description = "Catálogo de ubicaciones físicas del archivo (pasillo/estante/balda)")
public class UbicacionArchivoController {

    private final ArchivoService archivoService;

    @GetMapping
    @Operation(summary = "Listar ubicaciones de archivo", description = "Retorna el catálogo completo de ubicaciones físicas.")
    public ResponseEntity<ApiResponse<List<UbicacionArchivoResponseDTO>>> listar() {
        return ResponseEntity.ok(ApiResponse.ok(archivoService.listarUbicaciones(), "Ubicaciones de archivo obtenidas con éxito"));
    }

    @PostMapping
    @Operation(summary = "Crear ubicación de archivo", description = "Registra una ubicación física única por (pasillo, estante, balda).")
    public ResponseEntity<ApiResponse<UbicacionArchivoResponseDTO>> crear(@Valid @RequestBody CrearUbicacionArchivoRequestDTO dto) {
        UbicacionArchivoResponseDTO response = archivoService.crearUbicacion(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Ubicación de archivo creada exitosamente"));
    }
}
