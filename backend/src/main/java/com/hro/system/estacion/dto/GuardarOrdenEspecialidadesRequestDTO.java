package com.hro.system.estacion.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuardarOrdenEspecialidadesRequestDTO {

    /** Especialidades en el orden deseado (la primera será la primera en mostrarse). */
    @NotNull(message = "El orden de especialidades es obligatorio")
    @Builder.Default
    private List<Long> especialidadIds = new ArrayList<>();
}
