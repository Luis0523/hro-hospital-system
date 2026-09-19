package com.hro.system.medico.controller;

import com.hro.system.common.ApiResponse;
import com.hro.system.medico.dto.ActualizarMedicoRequestDTO;
import com.hro.system.medico.dto.CrearMedicoRequestDTO;
import com.hro.system.medico.dto.MedicoResponseDTO;
import com.hro.system.medico.service.MedicoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/medicos")
@RequiredArgsConstructor
@Tag(name = "Médicos", description = "Endpoints para registro y administración de médicos especialistas del hospital")
public class MedicoController {

    private final MedicoService medicoService;

    @PostMapping
    @Operation(summary = "Registrar nuevo médico", description = "Crea un registro de médico especialista validando número de colegiado único.")
    public ResponseEntity<ApiResponse<MedicoResponseDTO>> crear(@Valid @RequestBody CrearMedicoRequestDTO dto) {
        MedicoResponseDTO response = medicoService.crearMedico(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Médico registrado exitosamente"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar médico", description = "Actualiza nombres, colegiado o estado del médico.")
    public ResponseEntity<ApiResponse<MedicoResponseDTO>> actualizar(
            @PathVariable UUID id,
            @Valid @RequestBody ActualizarMedicoRequestDTO dto) {
        MedicoResponseDTO response = medicoService.actualizarMedico(id, dto);
        return ResponseEntity.ok(ApiResponse.ok(response, "Médico actualizado exitosamente"));
    }

    @GetMapping
    @Operation(summary = "Listar médicos activos", description = "Retorna el listado de médicos especialistas activos.")
    public ResponseEntity<ApiResponse<List<MedicoResponseDTO>>> listarActivos() {
        List<MedicoResponseDTO> lista = medicoService.listarActivos();
        return ResponseEntity.ok(ApiResponse.ok(lista, "Médicos obtenidos"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar médico por ID", description = "Obtiene los detalles de un médico por su ID.")
    public ResponseEntity<ApiResponse<MedicoResponseDTO>> buscarPorId(@PathVariable UUID id) {
        MedicoResponseDTO response = medicoService.buscarPorId(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Médico localizado"));
    }

    @GetMapping("/colegiado/{numeroColegiado}")
    @Operation(summary = "Buscar médico por colegiado", description = "Obtiene los datos de un médico por su número de colegiado.")
    public ResponseEntity<ApiResponse<MedicoResponseDTO>> buscarPorColegiado(@PathVariable String numeroColegiado) {
        MedicoResponseDTO response = medicoService.buscarPorColegiado(numeroColegiado);
        return ResponseEntity.ok(ApiResponse.ok(response, "Médico localizado"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Desactivar médico (Soft delete)", description = "Cambia el estado del médico a inactivo.")
    public ResponseEntity<ApiResponse<Void>> desactivar(@PathVariable UUID id) {
        medicoService.cambiarEstado(id, false);
        return ResponseEntity.ok(ApiResponse.ok(null, "Médico desactivado exitosamente"));
    }
}
