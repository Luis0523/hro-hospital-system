package com.hro.system.reporte.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DemandaEspecialidadDTO {
    private Long especialidadId;
    private String especialidadNombre;
    private long totalCitas;
    private long atendidas;
    private long inasistencias;
}
