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
    private Long asignacionDiariaEspacioId;
    private String espacioNumero;
    private Short nivel;
    private String subespecialidadNombre;
    private Integer turnoActual;
    private Integer turnoSiguiente;
    private OffsetDateTime ultimaActualizacion;
    /** Número de intento del turno cuando el evento es un llamado; null en el resto. */
    private Integer intentosLlamado;
    /** "LLAMADO" si el evento representa una acción real de llamar; "ACTUALIZACION" en el resto. */
    private String tipoEvento;
}
