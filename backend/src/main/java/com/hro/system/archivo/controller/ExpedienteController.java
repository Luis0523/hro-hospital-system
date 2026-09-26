package com.hro.system.archivo.controller;

import com.hro.system.archivo.dto.CrearExpedienteRequestDTO;
import com.hro.system.archivo.dto.ExpedienteJornadaDTO;
import com.hro.system.archivo.dto.ExpedienteResponseDTO;
import com.hro.system.archivo.dto.ReubicarExpedienteRequestDTO;
import com.hro.system.archivo.service.ArchivoService;
import com.hro.system.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/expedientes")
@RequiredArgsConstructor
@Tag(name = "Archivo - Expedientes", description = "Expediente físico del paciente: búsqueda por UUID/número, creación y reubicación")
public class ExpedienteController {

    private final ArchivoService archivoService;

    @GetMapping("/buscar")
    @Operation(summary = "Buscar expedientes",
            description = "Búsqueda paginada por número de expediente, DPI o nombre (data.content). Si se envía 'codigo', se resuelve el UUID (QR) o el número (código de barras) exacto y devuelve una página con ese expediente (404 si no existe).")
    public ResponseEntity<ApiResponse<Page<ExpedienteResponseDTO>>> buscar(
            @RequestParam(required = false) String filtro,
            @RequestParam(required = false) String codigo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageable = PageRequest.of(page, size);
        Page<ExpedienteResponseDTO> response = (codigo != null && !codigo.isBlank())
                ? archivoService.buscarPorCodigo(codigo, pageable)
                : archivoService.buscarExpedientes(filtro, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response, "Expedientes obtenidos con éxito"));
    }

    @GetMapping("/jornada")
    @Operation(summary = "Jornada de archivo",
            description = "Citas de una fecha (opcionalmente filtradas por subespecialidad) con el expediente físico a preparar y el estado de su ciclo. Fecha por defecto: hoy.")
    public ResponseEntity<ApiResponse<List<ExpedienteJornadaDTO>>> jornada(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) Long subespecialidadId) {
        List<ExpedienteJornadaDTO> jornada = archivoService.obtenerJornada(fecha, subespecialidadId);
        return ResponseEntity.ok(ApiResponse.ok(jornada, "Jornada de archivo obtenida"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener expediente por UUID", description = "Detalle del expediente por su UUID (flujo de escaneo de código QR).")
    public ResponseEntity<ApiResponse<ExpedienteResponseDTO>> obtenerPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(archivoService.obtenerExpediente(id), "Expediente obtenido exitosamente"));
    }

    @GetMapping("/numero/{numeroExpediente}")
    @Operation(summary = "Obtener expediente por número", description = "Detalle del expediente por su número impreso (flujo de escaneo de código de barras).")
    public ResponseEntity<ApiResponse<ExpedienteResponseDTO>> obtenerPorNumero(@PathVariable String numeroExpediente) {
        return ResponseEntity.ok(ApiResponse.ok(archivoService.obtenerExpedientePorNumero(numeroExpediente), "Expediente obtenido exitosamente"));
    }

    @GetMapping("/paciente/{pacienteId}")
    @Operation(summary = "Obtener expediente de un paciente", description = "Devuelve el expediente físico asociado a un paciente (relación 1:1).")
    public ResponseEntity<ApiResponse<ExpedienteResponseDTO>> obtenerPorPaciente(@PathVariable UUID pacienteId) {
        return ResponseEntity.ok(ApiResponse.ok(archivoService.obtenerExpedientePorPaciente(pacienteId), "Expediente del paciente obtenido exitosamente"));
    }

    @PostMapping
    @Operation(summary = "Crear expediente", description = "Registra el expediente físico de un paciente. El número se hereda del paciente si se omite.")
    public ResponseEntity<ApiResponse<ExpedienteResponseDTO>> crear(@Valid @RequestBody CrearExpedienteRequestDTO dto) {
        ExpedienteResponseDTO response = archivoService.crearExpediente(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Expediente creado exitosamente"));
    }

    @PatchMapping("/{id}/ubicacion-base")
    @Operation(summary = "Reubicar expediente", description = "Actualiza el casillero permanente (ubicación base) del expediente.")
    public ResponseEntity<ApiResponse<ExpedienteResponseDTO>> reubicar(
            @PathVariable UUID id,
            @Valid @RequestBody ReubicarExpedienteRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(archivoService.reubicarExpediente(id, dto), "Ubicación base actualizada exitosamente"));
    }
}
