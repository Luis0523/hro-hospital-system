package com.hro.system.estacion.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ClinicaFijaEstacionRequestDTO {
    @NotNull(message = "La especialidad es obligatoria")
    private Long especialidadId;

    @NotNull(message = "La clínica es obligatoria")
    private UUID espacioFisicoId;
}
