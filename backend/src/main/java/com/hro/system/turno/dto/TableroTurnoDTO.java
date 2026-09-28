package com.hro.system.turno.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TableroTurnoDTO {
    private Long asignacionDiariaEspacioId;
    private String espacioNumero;
    private Short nivel;
    private String subespecialidadNombre;
    private Long subespecialidadId;
    private Long especialidadId;
    private Integer turnoActual;
    private Integer turnoSiguiente;
    private OffsetDateTime ultimaActualizacion;
    /** Número de intento del turno cuando el evento es un llamado; null en el resto. */
    private Integer intentosLlamado;
    /** "LLAMADO" si el evento representa una acción real de llamar; "ACTUALIZACION" en el resto. */
    private String tipoEvento;
    /** Nombre del paciente del turno actualmente llamado (para llamar por nombre). */
    private String pacienteNombre;
    /** Números de turno en espera de esa sala (cola visible en el tablero). */
    private List<Integer> turnosEnEspera;
    /** true si el llamado se pidió por nombre. */
    private Boolean porNombre;
}
