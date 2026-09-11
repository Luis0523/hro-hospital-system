package com.hro.system.clinica.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicaResponseDTO {
    private Long id;
    private Long subespecialidadId;
    private String subespecialidadNombre;
    private Long especialidadId;
    private String especialidadNombre;
    private String nombre;
    private String ubicacion;
    private Boolean activo;
    private OffsetDateTime creadoEn;
}
