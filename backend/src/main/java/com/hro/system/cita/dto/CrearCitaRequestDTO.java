package com.hro.system.cita.dto;

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

    @NotNull(message = "El ID del usuario que registra la cita es obligatorio")
    private Long usuarioId;
}
