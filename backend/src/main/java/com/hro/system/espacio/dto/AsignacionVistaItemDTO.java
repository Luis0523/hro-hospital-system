package com.hro.system.espacio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Fila de la vista operativa del jefe de enfermería: una sala del nivel con las
 * subespecialidades asignadas para la fecha (lista vacía si aún no se seleccionó).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsignacionVistaItemDTO {
    private UUID espacioFisicoId;
    private String numero;
    private Short nivel;
    private Integer capacidadCamillas;

    /** Subespecialidades asignadas a la sala ese día (puede haber varias). */
    private List<AsignacionVistaSubDTO> asignaciones;
}
