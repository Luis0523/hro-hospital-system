package com.hro.system.estacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubespecialidadAsignadaDTO {
    private Long id;
    private String nombre;
    private Long especialidadId;
    private String especialidadNombre;
}
