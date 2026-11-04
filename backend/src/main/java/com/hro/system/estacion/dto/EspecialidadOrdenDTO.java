package com.hro.system.estacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EspecialidadOrdenDTO {
    private Long especialidadId;
    private String nombre;
    private String abreviatura;
    private Integer orden;
}
