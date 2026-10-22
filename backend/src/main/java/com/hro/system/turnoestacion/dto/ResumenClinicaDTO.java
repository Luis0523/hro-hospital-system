package com.hro.system.turnoestacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumenClinicaDTO {
    private UUID espacioFisicoId;
    private String numero;
    private String nombre;
    private Short nivel;
    /** Turnos asignados a esta clínica durante la fecha. */
    private long asignados;
    /** Devoluciones registradas (sin incluir las deshechas). */
    private long devueltos;
    /** Asignados que todavía no se han devuelto. */
    private long pendientes;
    /** Presentaciones registradas y asignadas a esta clínica. */
    private long presentaciones;
    private OffsetDateTime ultimaDevolucionEn;
}
