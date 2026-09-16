package com.hro.system.cita.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
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

    @Schema(description = "ID del usuario operativo o paciente. Opcional: si se omite, se toma del usuario autenticado.", example = "1")
    private Long usuarioId;

    @NotBlank(message = "El motivo de la cancelación es obligatorio para auditoría médica")
    @Schema(description = "Motivo de la cancelación", example = "Paciente canceló con 48h de anticipación por viaje")
    private String motivo;
}
