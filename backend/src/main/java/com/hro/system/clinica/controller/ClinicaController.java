package com.hro.system.clinica.controller;

import com.hro.system.common.ApiResponse;
import com.hro.system.clinica.dto.ActualizarClinicaRequestDTO;
import com.hro.system.clinica.dto.CrearClinicaRequestDTO;
import com.hro.system.clinica.dto.ClinicaResponseDTO;
import com.hro.system.clinica.service.ClinicaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/clinicas")
@RequiredArgsConstructor
@Tag(name = "Clínicas", description = "Endpoints para administración de clínicas y consultorios de consulta externa")
public class ClinicaController {

    private final ClinicaService clinicaService;

    @PostMapping
    @Operation(summary = "Crear nueva clínica / consultorio", description = "Registra una clínica vinculada a una subespecialidad con su ubicación.")
    public ResponseEntity<ApiResponse<ClinicaResponseDTO>> crear(@Valid @RequestBody CrearClinicaRequestDTO dto) {
        ClinicaResponseDTO response = clinicaService.crearClinica(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Clínica creada exitosamente"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar clínica", description = "Actualiza nombre, ubicación o estado de la clínica.")
    public ResponseEntity<ApiResponse<ClinicaResponseDTO>> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarClinicaRequestDTO dto) {
        ClinicaResponseDTO response = clinicaService.actualizarClinica(id, dto);
        return ResponseEntity.ok(ApiResponse.ok(response, "Clínica actualizada exitosamente"));
    }

    @GetMapping
    @Operation(summary = "Listar todas las clínicas activas", description = "Retorna el catálogo completo de clínicas activas con sus especialidades.")
    public ResponseEntity<ApiResponse<List<ClinicaResponseDTO>>> listarTodas() {
        List<ClinicaResponseDTO> lista = clinicaService.listarActivas();
        return ResponseEntity.ok(ApiResponse.ok(lista, "Listado de clínicas obtenido"));
    }

    @GetMapping("/subespecialidad/{subespecialidadId}")
    @Operation(summary = "Listar clínicas por subespecialidad", description = "Filtra las clínicas asociadas a una subespecialidad.")
    public ResponseEntity<ApiResponse<List<ClinicaResponseDTO>>> listarPorSubespecialidad(@PathVariable Long subespecialidadId) {
        List<ClinicaResponseDTO> lista = clinicaService.listarPorSubespecialidad(subespecialidadId);
        return ResponseEntity.ok(ApiResponse.ok(lista, "Clínicas filtradas por subespecialidad"));
    }

    @GetMapping("/especialidad/{especialidadId}")
    @Operation(summary = "Listar clínicas por especialidad", description = "Filtra las clínicas pertenecientes a una especialidad médica principal.")
    public ResponseEntity<ApiResponse<List<ClinicaResponseDTO>>> listarPorEspecialidad(@PathVariable Long especialidadId) {
        List<ClinicaResponseDTO> lista = clinicaService.listarPorEspecialidad(especialidadId);
        return ResponseEntity.ok(ApiResponse.ok(lista, "Clínicas filtradas por especialidad"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar clínica por ID", description = "Obtiene los detalles de una clínica.")
    public ResponseEntity<ApiResponse<ClinicaResponseDTO>> buscarPorId(@PathVariable Long id) {
        ClinicaResponseDTO response = clinicaService.buscarPorId(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Clínica localizada"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Desactivar clínica (Soft delete)", description = "Cambia el estado de la clínica a inactiva.")
    public ResponseEntity<ApiResponse<Void>> desactivar(@PathVariable Long id) {
        clinicaService.cambiarEstado(id, false);
        return ResponseEntity.ok(ApiResponse.ok(null, "Clínica desactivada exitosamente"));
    }
}
