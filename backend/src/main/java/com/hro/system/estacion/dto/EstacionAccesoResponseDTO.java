package com.hro.system.estacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EstacionAccesoResponseDTO {
    private Long id;
    private Long estacionId;
    private String estacionCodigo;
    private Long usuarioReferenciaId;
    private String usuarioNombre;
    private OffsetDateTime entradoEn;
    private OffsetDateTime salidoEn;
}
