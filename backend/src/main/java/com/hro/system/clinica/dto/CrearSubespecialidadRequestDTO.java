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
public class CrearSubespecialidadRequestDTO {

    @NotNull(message = "El ID de la especialidad es obligatorio")
    private Long especialidadId;

    @NotBlank(message = "El nombre de la subespecialidad es obligatorio")
    @Size(max = 150, message = "El nombre no puede exceder 150 caracteres")
    private String nombre;
}
