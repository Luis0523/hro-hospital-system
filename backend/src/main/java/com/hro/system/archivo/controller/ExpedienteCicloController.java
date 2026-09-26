package com.hro.system.archivo.controller;

import com.hro.system.archivo.dto.ExpedienteCicloResponseDTO;
import com.hro.system.archivo.dto.IniciarCicloRequestDTO;
import com.hro.system.archivo.dto.TransicionCicloRequestDTO;
import com.hro.system.archivo.service.ArchivoService;
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
import java.util.UUID;

@RestController
@RequestMapping("/expediente-ciclos")
@RequiredArgsConstructor
@Tag(name = "Archivo - Ciclos", description = "Viaje del expediente por cita: creación, consulta y transiciones del recorrido físico")
public class ExpedienteCicloController {

    private final ArchivoService archivoService;

    @PostMapping
    @Operation(summary = "Iniciar ciclo de expediente", description = "Crea el ciclo (viaje) del expediente para una cita en estado 'pendiente_localizar'. Responde 409 si la cita ya tiene ciclo.")
    public ResponseEntity<ApiResponse<ExpedienteCicloResponseDTO>> iniciar(@Valid @RequestBody IniciarCicloRequestDTO dto) {
        ExpedienteCicloResponseDTO response = archivoService.iniciarCiclo(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Ciclo de expediente iniciado exitosamente"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener ciclo por ID", description = "Detalle del ciclo con su timeline de movimientos (checkpoints).")
    public ResponseEntity<ApiResponse<ExpedienteCicloResponseDTO>> obtenerPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(archivoService.obtenerCiclo(id), "Ciclo obtenido exitosamente"));
    }

    @GetMapping("/cita/{citaId}")
    @Operation(summary = "Obtener ciclo de una cita", description = "Devuelve el ciclo asociado a una cita específica.")
    public ResponseEntity<ApiResponse<ExpedienteCicloResponseDTO>> obtenerPorCita(@PathVariable Long citaId) {
        return ResponseEntity.ok(ApiResponse.ok(archivoService.obtenerCicloPorCita(citaId), "Ciclo de la cita obtenido exitosamente"));
    }

    @GetMapping("/expediente/{expedienteId}")
    @Operation(summary = "Listar ciclos de un expediente", description = "Historial completo de viajes (ciclos) de un mismo expediente físico.")
    public ResponseEntity<ApiResponse<List<ExpedienteCicloResponseDTO>>> listarPorExpediente(@PathVariable UUID expedienteId) {
        return ResponseEntity.ok(ApiResponse.ok(archivoService.listarCiclosPorExpediente(expedienteId), "Ciclos del expediente obtenidos con éxito"));
    }

    @GetMapping
    @Operation(summary = "Cola de trabajo por estado", description = "Lista los ciclos filtrados por estado y/o fecha de la cita.")
    public ResponseEntity<ApiResponse<List<ExpedienteCicloResponseDTO>>> listarCola(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(ApiResponse.ok(archivoService.listarCola(estado, fecha), "Cola de archivo obtenida con éxito"));
    }

    @PostMapping("/{id}/iniciar-busqueda")
    @Operation(summary = "Iniciar búsqueda", description = "Transición 'pendiente_localizar' -> 'en_busqueda'.")
    public ResponseEntity<ApiResponse<ExpedienteCicloResponseDTO>> iniciarBusqueda(
            @PathVariable UUID id,
            @RequestBody(required = false) TransicionCicloRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(archivoService.iniciarBusqueda(id, dto), "Búsqueda iniciada"));
    }

    @PostMapping("/{id}/localizar")
    @Operation(summary = "Localizar expediente", description = "Transición 'en_busqueda' -> 'localizado'.")
    public ResponseEntity<ApiResponse<ExpedienteCicloResponseDTO>> localizar(
            @PathVariable UUID id,
            @RequestBody(required = false) TransicionCicloRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(archivoService.localizar(id, dto), "Expediente localizado"));
    }

    @PostMapping("/{id}/despachar")
    @Operation(summary = "Despachar a clínica", description = "Transición 'localizado' -> 'en_transito_entrega'.")
    public ResponseEntity<ApiResponse<ExpedienteCicloResponseDTO>> despachar(
            @PathVariable UUID id,
            @RequestBody(required = false) TransicionCicloRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(archivoService.despachar(id, dto), "Expediente despachado a la clínica"));
    }

    @PostMapping("/{id}/entregar")
    @Operation(summary = "Entregar en clínica", description = "Transición 'en_transito_entrega' -> 'entregado'.")
    public ResponseEntity<ApiResponse<ExpedienteCicloResponseDTO>> entregar(
            @PathVariable UUID id,
            @RequestBody(required = false) TransicionCicloRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(archivoService.entregar(id, dto), "Expediente entregado en la clínica"));
    }

    @PostMapping("/{id}/retornar")
    @Operation(summary = "Retornar a archivo", description = "Transición 'entregado' -> 'en_transito_retorno'.")
    public ResponseEntity<ApiResponse<ExpedienteCicloResponseDTO>> retornar(
            @PathVariable UUID id,
            @RequestBody(required = false) TransicionCicloRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(archivoService.retornar(id, dto), "Expediente en tránsito de retorno"));
    }

    @PostMapping("/{id}/archivar")
    @Operation(summary = "Archivar expediente", description = "Transición 'en_transito_retorno' -> 'archivado'. Cierra el ciclo.")
    public ResponseEntity<ApiResponse<ExpedienteCicloResponseDTO>> archivar(
            @PathVariable UUID id,
            @RequestBody(required = false) TransicionCicloRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(archivoService.archivar(id, dto), "Expediente archivado exitosamente"));
    }

    @PostMapping("/{id}/no-localizado")
    @Operation(summary = "Marcar como no localizado", description = "Marca el ciclo como 'no_localizado' desde cualquier estado activo. Requiere observación.")
    public ResponseEntity<ApiResponse<ExpedienteCicloResponseDTO>> noLocalizado(
            @PathVariable UUID id,
            @RequestBody(required = false) TransicionCicloRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(archivoService.marcarNoLocalizado(id, dto), "Expediente marcado como no localizado"));
    }

    @PostMapping("/{id}/reintentar-busqueda")
    @Operation(summary = "Reintentar búsqueda", description = "Transición 'no_localizado' -> 'en_busqueda'.")
    public ResponseEntity<ApiResponse<ExpedienteCicloResponseDTO>> reintentarBusqueda(
            @PathVariable UUID id,
            @RequestBody(required = false) TransicionCicloRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(archivoService.reintentarBusqueda(id, dto), "Búsqueda reintentada"));
    }
}
