package com.hro.system.archivo.dto;

/**
 * Etiqueta habilitada en una estación. `orden` corresponde al orden de
 * aparición configurado para esa estación.
 */
public record EtiquetaAsignadaResponseDTO(
        Long id,
        String codigo,
        String nombre,
        String descripcion,
        String icono,
        String color,
        Integer orden
) {
}
