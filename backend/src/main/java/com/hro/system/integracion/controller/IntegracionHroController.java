package com.hro.system.integracion.controller;

import com.hro.system.common.ApiResponse;
import com.hro.system.integracion.dto.PacienteHroDTO;
import com.hro.system.integracion.service.ExpedienteHroService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Consulta de pacientes en el API externo del hospital (FHIR). Devuelve solo la información
 * mínima necesaria (número de expediente y nombre completo).
 */
@RestController
@RequestMapping("/integracion/hro")
@RequiredArgsConstructor
@Tag(name = "Integración HRO", description = "Consulta al API del hospital por número de expediente")
public class IntegracionHroController {

    private final ExpedienteHroService expedienteHroService;

    @GetMapping("/paciente/{numeroExpediente}")
    @Operation(summary = "Buscar paciente en el API del hospital",
            description = "Consulta el API externo por número de expediente y devuelve número de expediente y nombre completo.")
    public ResponseEntity<ApiResponse<PacienteHroDTO>> paciente(@PathVariable String numeroExpediente) {
        PacienteHroDTO paciente = expedienteHroService.consultar(numeroExpediente);
        return ResponseEntity.ok(ApiResponse.ok(paciente, "Paciente consultado en el API del hospital"));
    }
}
