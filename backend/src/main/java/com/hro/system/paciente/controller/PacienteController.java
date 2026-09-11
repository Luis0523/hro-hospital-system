package com.hro.system.paciente.controller;

import com.hro.system.common.ApiResponse;
import com.hro.system.paciente.dto.CrearPacienteRequestDTO;
import com.hro.system.paciente.dto.PacienteResponseDTO;
import com.hro.system.paciente.service.PacienteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pacientes")
@RequiredArgsConstructor
@Tag(name = "Pacientes", description = "Endpoints para registro, consulta y búsqueda de pacientes")
public class PacienteController {

    private final PacienteService pacienteService;

    @PostMapping
    @Operation(summary = "Registrar nuevo paciente", description = "Crea un registro de paciente validando que el DPI sea único.")
    public ResponseEntity<ApiResponse<PacienteResponseDTO>> registrar(@Valid @RequestBody CrearPacienteRequestDTO dto) {
        PacienteResponseDTO response = pacienteService.registrarPaciente(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Paciente registrado exitosamente"));
    }

    @GetMapping("/dpi/{dpi}")
    @Operation(summary = "Buscar paciente por DPI", description = "Permite a la enfermera o personal de citas buscar a un paciente por su DPI.")
    public ResponseEntity<ApiResponse<PacienteResponseDTO>> buscarPorDpi(@PathVariable String dpi) {
        PacienteResponseDTO response = pacienteService.buscarPorDpi(dpi);
        return ResponseEntity.ok(ApiResponse.ok(response, "Paciente localizado con éxito"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar paciente por ID", description = "Obtiene los datos demográficos y expediente de un paciente por su ID.")
    public ResponseEntity<ApiResponse<PacienteResponseDTO>> buscarPorId(@PathVariable Long id) {
        PacienteResponseDTO response = pacienteService.buscarPorId(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Paciente localizado"));
    }

    @GetMapping
    @Operation(summary = "Listar todos los pacientes", description = "Retorna el listado de pacientes registrados.")
    public ResponseEntity<ApiResponse<List<PacienteResponseDTO>>> listarTodos() {
        List<PacienteResponseDTO> lista = pacienteService.listarTodos();
        return ResponseEntity.ok(ApiResponse.ok(lista, "Listado de pacientes obtenido"));
    }
}
