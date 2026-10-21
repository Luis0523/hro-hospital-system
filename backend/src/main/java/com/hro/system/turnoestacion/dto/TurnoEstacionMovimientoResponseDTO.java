package com.hro.system.turnoestacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TurnoEstacionMovimientoResponseDTO {
    private Long id;
    private String estadoAnterior;
    private String estadoNuevo;
    private String usuarioNombre;
    private String medicoNombre;
    private String observacion;
    private OffsetDateTime fechaMovimiento;
}
