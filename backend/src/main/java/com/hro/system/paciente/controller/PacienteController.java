package com.hro.system.paciente.controller;

import com.hro.system.common.ApiResponse;
import com.hro.system.paciente.dto.ActualizarPacienteRequestDTO;
import com.hro.system.paciente.dto.CrearPacienteRequestDTO;
import com.hro.system.paciente.dto.PacienteResponseDTO;
import com.hro.system.paciente.service.PacienteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/pacientes")
@RequiredArgsConstructor
@Tag(name = "Pacientes", description = "Endpoints para registro, consulta, actualización y búsqueda de pacientes (SCRUM-77)")
public class PacienteController {

    private final PacienteService pacienteService;

    @PostMapping
    @Operation(summary = "Registrar nuevo paciente", description = "Crea un registro de paciente validando que el DPI y expediente no estén duplicados.")
    public ResponseEntity<ApiResponse<PacienteResponseDTO>> registrar(@Valid @RequestBody CrearPacienteRequestDTO dto) {
        PacienteResponseDTO response = pacienteService.registrarPaciente(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Paciente registrado exitosamente"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar datos del paciente", description = "Actualiza nombres, apellidos, teléfono, dirección o número de expediente de un paciente.")
    public ResponseEntity<ApiResponse<PacienteResponseDTO>> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarPacienteRequestDTO dto) {
        PacienteResponseDTO response = pacienteService.actualizarPaciente(id, dto);
        return ResponseEntity.ok(ApiResponse.ok(response, "Paciente actualizado exitosamente"));
    }

    @GetMapping("/buscar")
    @Operation(summary = "Búsqueda multicriterio de pacientes", 
               description = "Buscador flexible por coincidencia parcial en DPI, número de expediente, nombres o apellidos. Ideal para Estación de Enfermería y Archivo.")
    public ResponseEntity<ApiResponse<Page<PacienteResponseDTO>>> buscar(
            @Parameter(description = "Término de búsqueda: DPI, carné de expediente o nombre")
            @RequestParam(required = false, defaultValue = "") String filtro,
            @ParameterObject @PageableDefault(size = 15, sort = "apellidos") Pageable pageable) {
        Page<PacienteResponseDTO> response = pacienteService.buscarMulticriterio(filtro, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response, "Búsqueda completada con éxito"));
    }

    @GetMapping("/dpi/{dpi}")
    @Operation(summary = "Buscar paciente por DPI", description = "Permite a la enfermera o personal de citas buscar a un paciente por su DPI.")
    public ResponseEntity<ApiResponse<PacienteResponseDTO>> buscarPorDpi(@PathVariable String dpi) {
        PacienteResponseDTO response = pacienteService.buscarPorDpi(dpi);
        return ResponseEntity.ok(ApiResponse.ok(response, "Paciente localizado con éxito"));
    }

    @GetMapping("/expediente/{numeroExpediente}")
    @Operation(summary = "Buscar paciente por Número de Expediente", description = "Permite al personal de archivo o enfermería buscar a un paciente por su número de carné/expediente.")
    public ResponseEntity<ApiResponse<PacienteResponseDTO>> buscarPorExpediente(@PathVariable String numeroExpediente) {
        PacienteResponseDTO response = pacienteService.buscarPorExpediente(numeroExpediente);
        return ResponseEntity.ok(ApiResponse.ok(response, "Paciente localizado con éxito por expediente"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar paciente por ID", description = "Obtiene los datos demográficos y expediente de un paciente por su ID primario.")
    public ResponseEntity<ApiResponse<PacienteResponseDTO>> buscarPorId(@PathVariable Long id) {
        PacienteResponseDTO response = pacienteService.buscarPorId(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Paciente localizado"));
    }

    @GetMapping
    @Operation(summary = "Listar pacientes paginados", description = "Retorna el listado paginado de pacientes registrados ordenados por apellido.")
    public ResponseEntity<ApiResponse<Page<PacienteResponseDTO>>> listar(
            @ParameterObject @PageableDefault(size = 20, sort = "apellidos") Pageable pageable) {
        Page<PacienteResponseDTO> pagina = pacienteService.listarPaginado(pageable);
        return ResponseEntity.ok(ApiResponse.ok(pagina, "Listado paginado de pacientes obtenido"));
    }
}
