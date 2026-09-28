package com.hro.system.clinica.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
public class SubespecialidadHorarioRequestDTO {

    @NotNull(message = "El ID de la subespecialidad es obligatorio")
    private Long subespecialidadId;

    @NotNull(message = "El día de la semana es obligatorio (1=Lunes a 7=Domingo)")
    @Min(value = 1, message = "El día de la semana debe ser entre 1 (Lunes) y 7 (Domingo)")
    @Max(value = 7, message = "El día de la semana debe ser entre 1 (Lunes) y 7 (Domingo)")
    private Short diaSemana;

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
