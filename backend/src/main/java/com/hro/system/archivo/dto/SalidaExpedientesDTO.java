package com.hro.system.archivo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Listado de expedientes que salen del Archivo en una fecha, con el total para el documento oficial.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalidaExpedientesDTO {
    private LocalDate fecha;
    private Integer total;
    private List<SalidaExpedienteDTO> items;
}
