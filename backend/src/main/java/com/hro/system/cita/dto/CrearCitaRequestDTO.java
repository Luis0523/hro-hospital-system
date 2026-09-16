package com.hro.system.cita.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrearCitaRequestDTO {

    @NotNull(message = "El ID del paciente es obligatorio")
    private Long pacienteId;

    @NotNull(message = "El ID del cupo diario es obligatorio")
    private Long cupoDiarioId;

    private LocalTime horaEstimada;
    private LocalTime horaVentanaInicio;
    private LocalTime horaVentanaFin;

    private Long citaOrigenId;

    @Schema(description = "ID del usuario que registra la cita. Opcional: si se omite, se toma del usuario autenticado (header X-Usuario-Id).", example = "1")
    private Long usuarioId;
}
