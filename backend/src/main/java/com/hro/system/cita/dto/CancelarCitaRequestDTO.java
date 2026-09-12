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
@Schema(description = "Solicitud para cancelación de una cita médica")
public class CancelarCitaRequestDTO {

    @NotNull(message = "El ID del usuario que registra la cancelación es obligatorio")
    @Schema(description = "ID del usuario operativo o paciente", example = "1")
    private Long usuarioId;

    @NotBlank(message = "El motivo de la cancelación es obligatorio para auditoría médica")
    @Schema(description = "Motivo de la cancelación", example = "Paciente canceló con 48h de anticipación por viaje")
    private String motivo;
}
