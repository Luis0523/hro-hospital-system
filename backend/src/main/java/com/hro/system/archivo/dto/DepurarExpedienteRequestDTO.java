package com.hro.system.archivo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Solicitud de depuración (baja lógica) de un expediente. Solo requiere el
 * número de expediente; el nombre del paciente lo resuelve el backend.
 */
@Data
public class DepurarExpedienteRequestDTO {

    @NotBlank(message = "El número de expediente es obligatorio")
    private String numeroExpediente;

    /** Motivo opcional de la baja (auditoría). */
    private String motivo;
}
