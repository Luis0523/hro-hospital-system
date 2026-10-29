package com.hro.system.archivo.dto;

/** Resumen de la etiqueta asociada a una salida de archivo. */
public record EtiquetaArchivoResumenDTO(
        Long id,
        String codigo,
        String nombre,
        String icono,
        String color
) {
}
