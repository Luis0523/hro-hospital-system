package com.hro.system.integracion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Información mínima del paciente devuelta por el backend tras consultar el API del hospital.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PacienteHroDTO {
    private String numeroExpediente;
    private String nombreCompleto;
}
