package com.hro.system.espacio.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Solicitud para asignar una subespecialidad a un espacio físico en una fecha")
public class CrearAsignacionDiariaRequestDTO {

    @NotNull(message = "El ID del espacio físico es obligatorio")
    private UUID espacioFisicoId;

    @NotNull(message = "El ID de la subespecialidad es obligatorio")
    private Long subespecialidadId;

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate fecha;
}
