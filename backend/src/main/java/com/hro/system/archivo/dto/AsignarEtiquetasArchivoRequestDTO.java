package com.hro.system.archivo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * Reemplaza las etiquetas habilitadas para una estación, en el orden recibido.
 * Una lista vacía deshabilita todas las etiquetas de esa estación.
 */
@Data
public class AsignarEtiquetasArchivoRequestDTO {

    @NotNull(message = "La lista de etiquetas es obligatoria")
    private List<Long> etiquetaIds;
}
