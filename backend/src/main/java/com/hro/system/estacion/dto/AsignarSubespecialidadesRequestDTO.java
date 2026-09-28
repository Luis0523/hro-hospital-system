package com.hro.system.estacion.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsignarSubespecialidadesRequestDTO {

    /** Conjunto completo de subespecialidades de la estación (reemplaza al actual). */
    @NotNull(message = "La lista de subespecialidades es obligatoria")
    @NotEmpty(message = "Debe indicar al menos una subespecialidad")
    private List<Long> subespecialidadIds;
}
