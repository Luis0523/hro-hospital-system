package com.hro.system.cita.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Solicitud para reprogramación de una cita médica")
public class ReprogramarCitaRequestDTO {

    @NotNull(message = "El ID del nuevo cupo diario es obligatorio")
    @Schema(description = "ID del nuevo cupo diario al que se transferirá el paciente", example = "15")
    private Long nuevoCupoDiarioId;

    @Schema(description = "ID del usuario operativo o médico que realiza el cambio. Opcional: si se omite, se toma del usuario autenticado.", example = "2")
    private Long usuarioId;

    @NotBlank(message = "El motivo de la reprogramación es obligatorio para auditoría médica")
    @Schema(description = "Justificación del cambio de fecha", example = "Solicitud del paciente por motivos laborales")
    private String motivo;
}
