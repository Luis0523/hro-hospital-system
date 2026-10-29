package com.hro.system.archivo.dto;

import java.time.OffsetDateTime;

/** Etiqueta del catálogo de Archivo. */
public record EtiquetaArchivoResponseDTO(
        Long id,
        String codigo,
        String nombre,
        String descripcion,
        String icono,
        String color,
        Integer orden,
        Boolean activo,
        OffsetDateTime creadoEn
) {
}
