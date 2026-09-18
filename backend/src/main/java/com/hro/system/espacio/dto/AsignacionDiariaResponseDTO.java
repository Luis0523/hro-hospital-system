package com.hro.system.espacio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsignacionDiariaResponseDTO {
    private Long id;
    private LocalDate fecha;
    private Long espacioFisicoId;
    private String espacioNumero;
    private Short nivel;
    private Long subespecialidadId;
    private String subespecialidadNombre;
    private Long especialidadId;
    private String especialidadNombre;
}
