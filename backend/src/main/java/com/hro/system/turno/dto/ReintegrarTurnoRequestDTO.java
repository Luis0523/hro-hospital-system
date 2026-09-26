package com.hro.system.turno.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Solicitud para reintegrar a la fila a un paciente en estado no_responde")
public class ReintegrarTurnoRequestDTO {

    @Schema(description = "ID del usuario que reintegra el turno. Opcional: si se omite, se toma del usuario autenticado.", example = "3")
    private Long usuarioId;

    @Schema(description = "Observaciones o motivo de la reintegración", example = "Paciente regresó de realizarse prueba de laboratorio")
    private String motivo;
}
