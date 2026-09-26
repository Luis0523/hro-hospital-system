package com.hro.system.archivo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpedienteMovimientoResponseDTO {
    private Long id;
    private String estadoAnterior;
    private String estadoNuevo;
    private UbicacionArchivoResponseDTO ubicacionOrigen;
    private UbicacionArchivoResponseDTO ubicacionDestino;
    private Long usuarioId;
    private String usuarioNombre;
    private String observacion;
    private OffsetDateTime fechaMovimiento;
}
