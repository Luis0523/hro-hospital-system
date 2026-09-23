package com.hro.system.reporte.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReporteCitasPorEstadoDTO {
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private long total;
    /** Conteo por estado de cita (pendiente, confirmada, atendida, cancelada, reprogramada, no_asistio). */
    private Map<String, Long> porEstado;
}
