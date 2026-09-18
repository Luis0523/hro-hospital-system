package com.hro.system.espacio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoberturaFaltanteDTO {
    private Long subespecialidadId;
    private String subespecialidadNombre;
}
