package com.hro.system.libro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LibroCitasDiaResponseDTO {
    private Long id;
    private LocalDate fecha;
    private Integer egresosHospitalarios;
    private Integer sobresEmergencia;
    private Integer sobresSellados;
    private Integer tia;
    private Integer totalExpedientes;
    private String observaciones;
    private String creadoPor;
    private OffsetDateTime creadoEn;
    private OffsetDateTime actualizadoEn;
    private List<LibroCitasEspecialidadResponseDTO> especialidades;
}
