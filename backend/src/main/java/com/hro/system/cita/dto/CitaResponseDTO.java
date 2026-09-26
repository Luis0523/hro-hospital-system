package com.hro.system.cita.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CitaResponseDTO {
    private Long id;
    private UUID pacienteId;
    private String pacienteNombreCompleto;
    private String pacienteDpi;
    private String pacienteExpediente;
    private UUID cupoDiarioId;
    private LocalDate fechaCita;
    private String subespecialidadNombre;
    private String medicoNombre;
    private LocalTime horaEstimada;
    private LocalTime horaVentanaInicio;
    private LocalTime horaVentanaFin;
    private Integer posicionEnFila;
    private Long minutosEsperaEstimados;
    private String estado;
    private Long citaOrigenId;
    private Integer version;
    private OffsetDateTime creadoEn;
    private OffsetDateTime actualizadoEn;
}
