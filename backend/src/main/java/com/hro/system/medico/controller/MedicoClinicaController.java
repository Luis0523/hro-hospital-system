package com.hro.system.medico.controller;

import com.hro.system.common.ApiResponse;
import com.hro.system.medico.dto.AsignarMedicoClinicaRequestDTO;
import com.hro.system.medico.dto.MedicoClinicaResponseDTO;
import com.hro.system.medico.service.MedicoClinicaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/medico-clinicas")
@RequiredArgsConstructor
@Tag(name = "Horarios y Capacidad Médica", description = "Endpoints para asignar médicos a clínicas, configurar días de atención, horarios y cupos máximos diarios")
public class MedicoClinicaController {

    private final MedicoClinicaService medicoClinicaService;

    @PostMapping
    @Operation(summary = "Asignar horario y cupo a médico en clínica", 
               description = "Establece el día de la semana (1=Lun ... 7=Dom), horas de atención, duración de consulta y capacidad máxima.")
    public ResponseEntity<ApiResponse<MedicoClinicaResponseDTO>> asignar(@Valid @RequestBody AsignarMedicoClinicaRequestDTO dto) {
        MedicoClinicaResponseDTO response = medicoClinicaService.asignarHorario(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Horario y cupo asignado exitosamente"));
    }

    @GetMapping("/clinica/{clinicaId}")
    @Operation(summary = "Listar horarios y médicos por clínica", description = "Obtiene todos los horarios médicos asignados a una clínica.")
    public ResponseEntity<ApiResponse<List<MedicoClinicaResponseDTO>>> listarPorClinica(@PathVariable Long clinicaId) {
        List<MedicoClinicaResponseDTO> lista = medicoClinicaService.listarPorClinica(clinicaId);
        return ResponseEntity.ok(ApiResponse.ok(lista, "Horarios de la clínica obtenidos"));
    }

    @GetMapping("/medico/{medicoId}")
    @Operation(summary = "Listar asignaciones y clínicas de un médico", description = "Obtiene todas las clínicas y horarios donde atiende un médico.")
    public ResponseEntity<ApiResponse<List<MedicoClinicaResponseDTO>>> listarPorMedico(@PathVariable Long medicoId) {
        List<MedicoClinicaResponseDTO> lista = medicoClinicaService.listarPorMedico(medicoId);
        return ResponseEntity.ok(ApiResponse.ok(lista, "Asignaciones del médico obtenidas"));
    }

    @GetMapping("/clinica/{clinicaId}/dia/{diaSemana}")
    @Operation(summary = "Consultar médicos atendiendo por clínica y día", 
               description = "Filtra los médicos que atienden en una clínica específica un día determinado (1=Lunes a 7=Domingo).")
    public ResponseEntity<ApiResponse<List<MedicoClinicaResponseDTO>>> listarPorClinicaYDia(
            @PathVariable Long clinicaId,
            @Parameter(description = "1 = Lunes, 2 = Martes, ..., 7 = Domingo") @PathVariable Short diaSemana) {
        List<MedicoClinicaResponseDTO> lista = medicoClinicaService.listarPorClinicaYDia(clinicaId, diaSemana);
        return ResponseEntity.ok(ApiResponse.ok(lista, "Médicos en atención para el día seleccionado"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar asignación por ID", description = "Obtiene los detalles de una asignación específica.")
    public ResponseEntity<ApiResponse<MedicoClinicaResponseDTO>> buscarPorId(@PathVariable Long id) {
        MedicoClinicaResponseDTO response = medicoClinicaService.buscarPorId(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Asignación localizada"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Desactivar horario (Soft delete)", description = "Desactiva la asignación de horario.")
    public ResponseEntity<ApiResponse<Void>> desactivar(@PathVariable Long id) {
        medicoClinicaService.cambiarEstado(id, false);
        return ResponseEntity.ok(ApiResponse.ok(null, "Horario desactivado exitosamente"));
    }
}
