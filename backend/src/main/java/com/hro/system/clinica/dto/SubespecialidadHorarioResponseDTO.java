package com.hro.system.clinica.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubespecialidadHorarioResponseDTO {
    private UUID id;
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
}
