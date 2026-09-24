package com.hro.system.archivo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActaRecepcionDetalleDTO {
    private Long id;
    private UUID expedienteId;
    private String numeroExpediente;
    private UUID pacienteId;
    private String pacienteNombre;
    private Long citaId;
    private String estadoActual;
}
