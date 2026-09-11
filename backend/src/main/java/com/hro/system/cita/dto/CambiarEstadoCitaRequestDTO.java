package com.hro.system.cita.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CambiarEstadoCitaRequestDTO {

    @NotBlank(message = "El nuevo estado es obligatorio")
    @Pattern(regexp = "pendiente|confirmada|atendida|cancelada|reprogramada|no_asistio",
            message = "Estado inválido. Debe ser: pendiente, confirmada, atendida, cancelada, reprogramada o no_asistio")
    private String nuevoEstado;

    @NotNull(message = "El ID del usuario responsable del cambio es obligatorio")
    private Long usuarioId;

    private String motivo;
}
