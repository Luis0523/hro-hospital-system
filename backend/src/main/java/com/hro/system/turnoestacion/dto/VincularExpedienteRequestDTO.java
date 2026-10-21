package com.hro.system.turnoestacion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VincularExpedienteRequestDTO {

    @NotBlank(message = "El número de colegiado es obligatorio")
    private String numeroColegiado;

    @NotNull(message = "La clínica es obligatoria")
    private UUID espacioFisicoId;

    @NotBlank(message = "El número de expediente es obligatorio")
    @Size(max = 30, message = "El número de expediente no puede superar 30 caracteres")
    private String numeroExpediente;

    private String observacion;
}
