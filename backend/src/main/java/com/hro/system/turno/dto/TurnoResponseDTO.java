package com.hro.system.turno.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TurnoResponseDTO {
    private Long id;
    private Long citaId;
    private Integer numeroTurno;
    private String estado;
    private Integer intentosLlamado;
    private Long clinicaId;
    private String clinicaNombre;
    private String medicoNombre;
    private OffsetDateTime horaGenerado;
    private OffsetDateTime horaLlamado;
    private OffsetDateTime horaAtendido;
}
