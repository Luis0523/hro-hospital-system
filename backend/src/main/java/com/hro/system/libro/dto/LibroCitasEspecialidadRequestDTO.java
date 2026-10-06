package com.hro.system.libro.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LibroCitasEspecialidadRequestDTO {

    @NotNull(message = "El ID de la subespecialidad es obligatorio")
    private Long subespecialidadId;

    @NotNull(message = "La cantidad de expedientes es obligatoria")
    @Min(value = 0, message = "La cantidad de expedientes no puede ser negativa")
    private Integer cantidadExpedientes;
}
