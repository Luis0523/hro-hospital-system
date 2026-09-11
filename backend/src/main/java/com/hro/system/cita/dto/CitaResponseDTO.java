package com.hro.system.cita.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CitaResponseDTO {
    private Long id;
    private Long pacienteId;
    private String pacienteNombreCompleto;
    private String pacienteDpi;
    private String pacienteExpediente;
    private Long cupoDiarioId;
    private LocalDate fechaCita;
    private String clinicaNombre;
    private String medicoNombre;
    private LocalTime horaEstimada;
    private LocalTime horaVentanaInicio;
    private LocalTime horaVentanaFin;
    private String estado;
    private Long citaOrigenId;
    private Integer version;
    private OffsetDateTime creadoEn;
    private OffsetDateTime actualizadoEn;
}
