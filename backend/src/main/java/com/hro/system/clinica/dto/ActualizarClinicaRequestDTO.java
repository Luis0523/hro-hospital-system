package com.hro.system.clinica.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActualizarClinicaRequestDTO {

    @NotNull(message = "El ID de la subespecialidad es obligatorio")
    private Long subespecialidadId;

    @NotBlank(message = "El nombre de la clínica es obligatorio")
    @Size(max = 150, message = "El nombre no puede exceder 150 caracteres")
    private String nombre;

    @Size(max = 150, message = "La ubicación no puede exceder 150 caracteres")
    private String ubicacion;

    @NotNull(message = "El estado activo es obligatorio")
    private Boolean activo;
}
