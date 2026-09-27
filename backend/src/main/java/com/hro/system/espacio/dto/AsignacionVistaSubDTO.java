package com.hro.system.espacio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Subespecialidad asignada a una sala (una sala puede tener varias el mismo día). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsignacionVistaSubDTO {
    private Long asignacionId;
    private Long subespecialidadId;
    private String subespecialidadNombre;
    private Long especialidadId;
    private String especialidadNombre;
}
