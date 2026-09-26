package com.hro.system.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertaAdminDTO {

    /** Código estable para manejo programático (ej. CUPOS_AGOTADOS). */
    private String codigo;

    /** Severidad: INFO, ADVERTENCIA o CRITICA. */
    private String severidad;

    private String mensaje;
}
