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
public class TableroTurnoDTO {
    private Long clinicaId;
    private String clinicaNombre;
    private String consultorioUbicacion;
    private Integer turnoActual;
    private Integer turnoSiguiente;
    private OffsetDateTime ultimaActualizacion;
}
