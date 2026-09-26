package com.hro.system.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Resumen administrativo de una fecha. Los indicadores se calculan en backend;
 * el frontend solo los muestra.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumenAdminDTO {

    private LocalDate fecha;

    private long totalCitas;
    private long citasPendientes;
    private long citasConfirmadas;
    private long citasAtendidas;
    private long citasCanceladas;
    private long citasReprogramadas;
    private long inasistencias;

    private int capacidadTotal;
    private int cuposOcupados;
    private int cuposDisponibles;

    /** Porcentaje de inasistencia sobre (atendidas + inasistencias), redondeado a 2 decimales. */
    private double tasaInasistencia;

    private List<AlertaAdminDTO> alertas;
}
