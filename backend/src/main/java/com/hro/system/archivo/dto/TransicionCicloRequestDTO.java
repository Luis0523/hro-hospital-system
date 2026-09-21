package com.hro.system.archivo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Cuerpo opcional para las transiciones del ciclo.
 * {@code ubicacionDestinoId} aplica a despachar/archivar; {@code observacion} es libre.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransicionCicloRequestDTO {
    private Long ubicacionDestinoId;
    private String observacion;
}
