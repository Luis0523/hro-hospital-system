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
public class MedicoClinicaResponseDTO {
    private Long id;
    private Long medicoId;
    private String medicoNombre;
    private String numeroColegiado;
    private Long clinicaId;
    private String clinicaNombre;
    private String subespecialidadNombre;
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
