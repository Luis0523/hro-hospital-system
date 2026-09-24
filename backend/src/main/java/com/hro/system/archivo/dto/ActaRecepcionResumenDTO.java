package com.hro.system.archivo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActaRecepcionResumenDTO {
    private Long id;
    private String numeroActa;
    private LocalDate fecha;
    private Long subespecialidadId;
    private String subespecialidadNombre;
    private String creadoPorNombre;
    private int totalExpedientes;
    private OffsetDateTime creadoEn;
}
