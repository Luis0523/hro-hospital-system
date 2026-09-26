package com.hro.system.archivo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActaRecepcionResponseDTO {
    private Long id;
    private String numeroActa;
    private LocalDate fecha;

    private Long subespecialidadId;
    private String subespecialidadNombre;

    private Long usuarioEntregaId;
    private String usuarioEntregaNombre;
    private Long usuarioRecibeId;
    private String usuarioRecibeNombre;

    private String observaciones;
    private String creadoPorNombre;
    private OffsetDateTime creadoEn;

    private int totalExpedientes;
    private List<ActaRecepcionDetalleDTO> detalles;
}
