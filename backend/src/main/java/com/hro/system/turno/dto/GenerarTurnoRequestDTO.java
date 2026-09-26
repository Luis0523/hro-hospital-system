package com.hro.system.turno.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerarTurnoRequestDTO {

    @NotNull(message = "El ID de la cita es obligatorio")
    private Long citaId;

    /**
     * Opcional: si se omite, se toma del usuario autenticado (header X-Usuario-Id).
     */
    private Long usuarioId;
}
