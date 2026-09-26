package com.hro.system.medico.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

/**
 * Actualización de una programación médica existente. No permite cambiar médico,
 * subespecialidad ni día de la semana (clave de la programación): solo horario,
 * capacidad y duración de consulta.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActualizarMedicoSubespecialidadRequestDTO {

    @NotNull(message = "La hora de inicio es obligatoria")
    private LocalTime horaInicio;

    @NotNull(message = "La hora de fin es obligatoria")
    private LocalTime horaFin;

    @NotNull(message = "La capacidad máxima de pacientes es obligatoria")
    @Min(value = 1, message = "La capacidad máxima debe ser al menos 1 paciente")
    private Integer capacidadMaxima;

    @Min(value = 5, message = "La duración de consulta debe ser al menos 5 minutos")
    private Integer duracionConsultaMinutos;
}
