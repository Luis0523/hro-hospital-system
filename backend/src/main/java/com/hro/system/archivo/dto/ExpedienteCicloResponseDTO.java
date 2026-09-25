package com.hro.system.archivo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpedienteCicloResponseDTO {
    private UUID id;
    private UUID expedienteId;
    private String numeroExpediente;
    private PacienteResumenDTO paciente;
    private Long citaId;
    private String estadoActual;
    private Integer version;
    private OffsetDateTime creadoEn;
    private OffsetDateTime actualizadoEn;
    private List<ExpedienteMovimientoResponseDTO> movimientos;
}
