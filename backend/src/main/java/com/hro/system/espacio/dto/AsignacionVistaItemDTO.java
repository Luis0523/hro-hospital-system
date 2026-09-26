package com.hro.system.espacio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Fila de la vista operativa del jefe de enfermería: una sala del nivel con la
 * subespecialidad seleccionada para la fecha (o nula si aún no se seleccionó).
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

    /** ID de la asignación de esa sala/fecha; {@code null} si no hay selección. */
    private Long asignacionId;

    private Long subespecialidadId;
    private String subespecialidadNombre;
    private Long especialidadId;
    private String especialidadNombre;
}
