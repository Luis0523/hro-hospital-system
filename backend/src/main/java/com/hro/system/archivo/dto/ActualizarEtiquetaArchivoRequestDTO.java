package com.hro.system.archivo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Edición de una etiqueta del catálogo de Archivo. */
@Data
public class ActualizarEtiquetaArchivoRequestDTO {

    @NotBlank(message = "El código es obligatorio")
    @Size(max = 40, message = "El código no puede superar 40 caracteres")
    private String codigo;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 80, message = "El nombre no puede superar 80 caracteres")
    private String nombre;

    @Size(max = 255, message = "La descripción no puede superar 255 caracteres")
    private String descripcion;

    @Size(max = 40, message = "El icono no puede superar 40 caracteres")
    private String icono;

    @Size(max = 20, message = "El color no puede superar 20 caracteres")
    private String color;

    private Integer orden;

    private Boolean activo;
}
