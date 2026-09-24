package com.hro.system.archivo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Resumen operativo diario del departamento de Archivo.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumenArchivoDTO {
    private LocalDate fecha;

    private long totalCiclos;

    private long pendienteLocalizar;
    private long enBusqueda;
    private long localizado;
    private long enTransitoEntrega;
    private long enTransitoRetorno;
    private long entregado;
    private long archivado;
    private long noLocalizado;

    /** Suma de tránsito (entrega + retorno). */
    private long enTransito;

    /** Expedientes físicos registrados en la fecha. */
    private long expedientesNuevos;
}
