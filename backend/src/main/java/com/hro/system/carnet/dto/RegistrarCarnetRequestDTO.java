package com.hro.system.carnet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** Registro de un carnet por parte de la estación de enfermería. */
@Data
public class RegistrarCarnetRequestDTO {

    @NotBlank(message = "El número de expediente es obligatorio")
    private String numeroExpediente;

    @NotNull(message = "La especialidad es obligatoria")
    private Long especialidadId;

    /** Opcional: si no se indica, se toma la estación de la sesión (X-Estacion-Id). */
    private Long estacionId;
}
