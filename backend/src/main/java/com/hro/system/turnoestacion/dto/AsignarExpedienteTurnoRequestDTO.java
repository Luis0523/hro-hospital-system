package com.hro.system.turnoestacion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsignarExpedienteTurnoRequestDTO {

    @NotBlank(message = "El número de expediente es obligatorio")
    @Size(max = 30, message = "El número de expediente no puede superar 30 caracteres")
    private String numeroExpediente;

    /**
     * Nombre capturado manualmente cuando el expediente físico no coincide con el HRO.
     * Si viene informado, el backend no consulta el API externo ni el padrón local.
     */
    @Size(max = 200, message = "El nombre del paciente no puede superar 200 caracteres")
    private String pacienteNombre;
}
