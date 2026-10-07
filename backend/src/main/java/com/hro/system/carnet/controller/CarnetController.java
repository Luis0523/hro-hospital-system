package com.hro.system.carnet.controller;

import com.hro.system.carnet.dto.CarnetResponseDTO;
import com.hro.system.carnet.dto.RegistrarCarnetRequestDTO;
import com.hro.system.carnet.dto.TransicionCarnetRequestDTO;
import com.hro.system.carnet.service.CarnetService;
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
@RequestMapping("/carnets")
@RequiredArgsConstructor
@Tag(name = "Carnets", description = "Registro y seguimiento del carnet: recepción en enfermería, búsqueda en Archivo, despacho, recepción y devolución")
public class CarnetController {

    private final CarnetService carnetService;

    @PostMapping
    @Operation(summary = "Registrar carnet",
            description = "Consulta el expediente en el API del hospital y asigna el correlativo diario por especialidad. 404 si el expediente no existe; 409 si ya fue registrado hoy.")
    public ResponseEntity<ApiResponse<CarnetResponseDTO>> registrar(@Valid @RequestBody RegistrarCarnetRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(carnetService.registrar(dto), "Carnet registrado exitosamente"));
    }

    @GetMapping
    @Operation(summary = "Listar carnets del día",
            description = "Listado filtrable por fecha (por defecto hoy), estación, especialidad y estado.")
    public ResponseEntity<ApiResponse<List<CarnetResponseDTO>>> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) Long estacionId,
            @RequestParam(required = false) Long especialidadId,
            @RequestParam(required = false) String estado) {
        return ResponseEntity.ok(ApiResponse.ok(
                carnetService.listar(fecha, estacionId, especialidadId, estado), "Carnets obtenidos"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener carnet", description = "Detalle del carnet con su historial de movimientos.")
    public ResponseEntity<ApiResponse<CarnetResponseDTO>> obtener(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(carnetService.obtener(id), "Carnet obtenido"));
    }

    @PostMapping("/{id}/encontrado")
    @Operation(summary = "Marcar encontrado (Archivo)", description = "registrado/no_localizado -> encontrado.")
    public ResponseEntity<ApiResponse<CarnetResponseDTO>> encontrado(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(carnetService.marcarEncontrado(id), "Carnet marcado como encontrado"));
    }

    @PostMapping("/{id}/no-localizado")
    @Operation(summary = "Marcar no localizado (Archivo)", description = "Requiere observación. registrado/encontrado -> no_localizado.")
    public ResponseEntity<ApiResponse<CarnetResponseDTO>> noLocalizado(
            @PathVariable UUID id,
            @RequestBody(required = false) TransicionCarnetRequestDTO dto) {
        String observacion = (dto != null) ? dto.getObservacion() : null;
        return ResponseEntity.ok(ApiResponse.ok(carnetService.marcarNoLocalizado(id, observacion), "Carnet marcado como no localizado"));
    }

    @PostMapping("/{id}/despachar")
    @Operation(summary = "Despachar a la estación (Archivo)", description = "encontrado -> despachado.")
    public ResponseEntity<ApiResponse<CarnetResponseDTO>> despachar(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(carnetService.despachar(id), "Carnet despachado"));
    }

    @PostMapping("/{id}/recibir")
    @Operation(summary = "Recibir en la estación (Enfermería / COEX)", description = "despachado -> recibido_estacion.")
    public ResponseEntity<ApiResponse<CarnetResponseDTO>> recibir(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(carnetService.recibir(id), "Carnet recibido en la estación"));
    }

    @PostMapping("/{id}/devolver")
    @Operation(summary = "Devolver a Archivo (Enfermería / COEX)", description = "recibido_estacion -> devuelto_estacion. Respeta el tiempo mínimo configurable.")
    public ResponseEntity<ApiResponse<CarnetResponseDTO>> devolver(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(carnetService.devolver(id), "Carnet devuelto a Archivo"));
    }

    @PostMapping("/{id}/recibir-devolucion")
    @Operation(summary = "Confirmar devolución (Archivo)", description = "devuelto_estacion -> recibido_archivo.")
    public ResponseEntity<ApiResponse<CarnetResponseDTO>> recibirDevolucion(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(carnetService.recibirDevolucion(id), "Devolución recibida por Archivo"));
    }
}
