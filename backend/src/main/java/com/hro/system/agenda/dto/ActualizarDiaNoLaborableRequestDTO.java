package com.hro.system.agenda.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Edición de un día no laborable. La fecha no se modifica: para cambiarla se
 * elimina el registro y se crea uno nuevo.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActualizarDiaNoLaborableRequestDTO {

    @NotBlank(message = "El motivo del asueto/feriado es obligatorio")
    @Size(max = 200, message = "El motivo no puede exceder 200 caracteres")
    private String motivo;
}
