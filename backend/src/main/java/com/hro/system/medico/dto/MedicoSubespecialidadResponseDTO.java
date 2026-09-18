package com.hro.system.medico.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicoSubespecialidadResponseDTO {
    private Long id;
    private Long medicoId;
    private String medicoNombre;
    private String numeroColegiado;
    private Long subespecialidadId;
    private String subespecialidadNombre;
    private Long especialidadId;
    private String especialidadNombre;
    private Short diaSemana;
    private String diaSemanaNombre;
    private LocalTime horaInicio;
    private LocalTime horaFin;
    private Integer capacidadMaxima;
    private Integer duracionConsultaMinutos;
    private Boolean activo;
    private OffsetDateTime creadoEn;
}
