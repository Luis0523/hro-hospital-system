package com.hro.system.reporte.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReporteUtilizacionCuposDTO {
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private Long subespecialidadId;
    private int capacidadTotal;
    private int cuposOcupados;
    private int cuposDisponibles;
    /** Porcentaje de utilización (ocupados / capacidad), redondeado a 2 decimales. */
    private double utilizacionPorcentaje;
}
