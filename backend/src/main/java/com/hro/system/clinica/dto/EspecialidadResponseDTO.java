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
public class EspecialidadResponseDTO {
    private Long id;
    private String nombre;
    private Boolean activo;
    private OffsetDateTime creadoEn;
}
