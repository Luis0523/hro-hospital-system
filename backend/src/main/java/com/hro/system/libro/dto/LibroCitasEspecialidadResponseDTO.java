package com.hro.system.libro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LibroCitasEspecialidadResponseDTO {
    private Long subespecialidadId;
    private String subespecialidadNombre;
    private Integer cantidadExpedientes;
}
