package com.hro.system.archivo.controller;

import com.hro.system.archivo.dto.ActaRecepcionResumenDTO;
import com.hro.system.archivo.dto.ActaRecepcionResponseDTO;
import com.hro.system.archivo.dto.CrearActaRecepcionRequestDTO;
import com.hro.system.archivo.service.ActaRecepcionService;
import com.hro.system.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/actas-recepcion")
@RequiredArgsConstructor
@Tag(name = "Archivo - Actas de recepción", description = "Registro y PDF de actas de entrega/recepción de expedientes físicos")
public class ActaRecepcionController {

    private final ActaRecepcionService actaRecepcionService;

    @PostMapping
    @Operation(summary = "Crear acta de recepción",
            description = "Registra un acta con N expedientes de una jornada/unidad, quién entrega y quién recibe. Genera el número ACT-YYYY-NNNN.")
    public ResponseEntity<ApiResponse<ActaRecepcionResponseDTO>> crear(@Valid @RequestBody CrearActaRecepcionRequestDTO dto) {
        ActaRecepcionResponseDTO response = actaRecepcionService.crear(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Acta de recepción creada exitosamente"));
    }

    @GetMapping
    @Operation(summary = "Listar actas", description = "Filtros opcionales por fecha y subespecialidad.")
    public ResponseEntity<ApiResponse<List<ActaRecepcionResumenDTO>>> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) Long subespecialidadId) {
        return ResponseEntity.ok(ApiResponse.ok(actaRecepcionService.listar(fecha, subespecialidadId), "Actas obtenidas"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener acta por ID", description = "Detalle del acta con la lista de expedientes incluidos.")
    public ResponseEntity<ApiResponse<ActaRecepcionResponseDTO>> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(actaRecepcionService.obtener(id), "Acta obtenida"));
    }

    @GetMapping("/{id}/pdf")
    @Operation(summary = "Descargar acta en PDF", description = "Genera y descarga el documento PDF oficial del acta.")
    public ResponseEntity<byte[]> pdf(@PathVariable Long id) {
        byte[] pdf = actaRecepcionService.generarPdf(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"acta-" + id + ".pdf\"")
                .body(pdf);
    }
}
