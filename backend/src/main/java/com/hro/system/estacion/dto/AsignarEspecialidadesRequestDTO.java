package com.hro.system.estacion.dto;

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
public class AsignarEspecialidadesRequestDTO {

    /** Conjunto completo de especialidades de la estación (reemplaza al actual; vacío = limpiar). */
    @NotNull(message = "La lista de especialidades es obligatoria")
    private List<Long> especialidadIds;
}
