package com.hro.system.archivo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Registro manual de una depuración cuando el API del hospital no responde. */
@Data
public class DepurarExpedienteManualRequestDTO {

    @NotBlank(message = "El número de expediente es obligatorio")
    @Size(max = 30, message = "El número de expediente no puede superar 30 caracteres")
    private String numeroExpediente;

    @NotBlank(message = "El nombre del paciente es obligatorio")
    @Size(max = 200, message = "El nombre del paciente no puede superar 200 caracteres")
    private String pacienteNombre;

    private String motivo;
}
