package com.hro.system.estacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Especialidad con atención activa en una estación para una fecha. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EspecialidadActivaDTO {
    private Long id;
    private String nombre;
    private String abreviatura;
}
