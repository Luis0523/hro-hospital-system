package com.hro.system.carnet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Corrección de la especialidad de un carnet ya registrado. Solo aplica a carnets
 * de la fecha de hoy: el correlativo diario es temporal y nunca se corrige en días
 * pasados.
 */
@Data
public class CorregirEspecialidadRequestDTO {

    @NotNull(message = "La especialidad destino es obligatoria")
    private Long especialidadId;

    @NotBlank(message = "El motivo de la corrección es obligatorio")
    @Size(max = 500, message = "El motivo no puede exceder 500 caracteres")
    private String motivo;
}
