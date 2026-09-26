package com.hro.system.cita.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CitaHistorialResponseDTO {
    private Long id;
    private Long citaId;
    private String estadoAnterior;
    private String estadoNuevo;
    private Long usuarioId;
    private String usuarioNombre;
    private String motivo;
    private OffsetDateTime fechaCambio;
}
