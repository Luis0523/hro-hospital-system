package com.hro.system.carnet.controller;

import com.hro.system.carnet.dto.CarnetResponseDTO;
import com.hro.system.carnet.dto.CorregirEspecialidadRequestDTO;
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
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String clasificacion) {
        return ResponseEntity.ok(ApiResponse.ok(
                carnetService.listar(fecha, estacionId, especialidadId, estado, clasificacion), "Carnets obtenidos"));
    }

    @GetMapping("/expediente/{numeroExpediente}")
    @Operation(summary = "Buscar carnet por expediente",
            description = "Devuelve el carnet de un expediente en una fecha (por defecto hoy) con su trazabilidad. 404 si no existe.")
    public ResponseEntity<ApiResponse<CarnetResponseDTO>> buscarPorExpediente(
            @PathVariable String numeroExpediente,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(ApiResponse.ok(
                carnetService.buscarPorExpediente(numeroExpediente, fecha), "Carnet obtenido"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener carnet", description = "Detalle del carnet con su historial de movimientos.")
    public ResponseEntity<ApiResponse<CarnetResponseDTO>> obtener(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(carnetService.obtener(id), "Carnet obtenido"));
    }

    @PostMapping("/{id}/corregir-especialidad")
    @Operation(summary = "Corregir especialidad de un carnet",
            description = "Reasigna el carnet a otra especialidad del día y le da un nuevo correlativo. Enfermería solo puede corregir los 2 más recientes del día (aún no despachados); un rol supervisor, cualquiera de hoy.")
    public ResponseEntity<ApiResponse<CarnetResponseDTO>> corregirEspecialidad(
            @PathVariable UUID id,
            @Valid @RequestBody CorregirEspecialidadRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(
                carnetService.corregirEspecialidad(id, dto), "Especialidad del carnet corregida"));
    }

    @PostMapping("/{id}/no-localizado")
    @Operation(summary = "Marcar no localizado (Archivo)", description = "Requiere observación. registrado -> no_localizado.")
    public ResponseEntity<ApiResponse<CarnetResponseDTO>> noLocalizado(
            @PathVariable UUID id,
            @RequestBody(required = false) TransicionCarnetRequestDTO dto) {
        String observacion = (dto != null) ? dto.getObservacion() : null;
        return ResponseEntity.ok(ApiResponse.ok(carnetService.marcarNoLocalizado(id, observacion), "Carnet marcado como no localizado"));
    }

    @PostMapping("/{id}/salida-archivo")
    @Operation(summary = "Registrar salida de archivo",
            description = "registrado/no_localizado -> salida_archivo. Un operador verifica que el expediente sale del archivo.")
    public ResponseEntity<ApiResponse<CarnetResponseDTO>> salidaArchivo(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(carnetService.salidaArchivo(id), "Salida de archivo registrada"));
    }

    @PostMapping("/{id}/salida-enfermeria")
    @Operation(summary = "Registrar salida de enfermería (Mesa COEX)",
            description = "salida_archivo -> salida_enfermeria. El expediente sale de enfermería de regreso a archivo.")
    public ResponseEntity<ApiResponse<CarnetResponseDTO>> salidaEnfermeria(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(carnetService.salidaEnfermeria(id), "Salida de enfermería registrada"));
    }

    @PostMapping("/{id}/resguardar")
    @Operation(summary = "Resguardar en estantería (Archivo)",
            description = "salida_enfermeria -> resguardado. Archivo confirma el reingreso y guardado del expediente.")
    public ResponseEntity<ApiResponse<CarnetResponseDTO>> resguardar(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(carnetService.resguardar(id), "Expediente resguardado en estantería"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar un carnet erróneo (físico)",
            description = "Borrado físico de un carnet del día. Enfermería solo los 2 más recientes (aún no despachados); un rol supervisor, cualquiera de hoy. Cierra el contador si era la cola.")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable UUID id) {
        carnetService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Carnet eliminado"));
    }
}
