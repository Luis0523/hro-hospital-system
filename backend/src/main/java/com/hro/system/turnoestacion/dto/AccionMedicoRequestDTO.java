package com.hro.system.turnoestacion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccionMedicoRequestDTO {

    @NotBlank(message = "El número de colegiado es obligatorio")
    private String numeroColegiado;

    @NotNull(message = "La clínica es obligatoria")
    private UUID espacioFisicoId;

    private String observacion;
}
