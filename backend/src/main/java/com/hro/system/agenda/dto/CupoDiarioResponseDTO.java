package com.hro.system.agenda.dto;

import com.hro.system.agenda.entity.CupoDiario;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Respuesta con detalle de cupos diarios y disponibilidad de atención por subespecialidad")
public class CupoDiarioResponseDTO {

    @Schema(description = "ID del registro de cupo diario")
    private UUID id;

    @Schema(description = "ID del horario de subespecialidad")
    private UUID subespecialidadHorarioId;

    @Schema(description = "ID de la subespecialidad")
    private Long subespecialidadId;

    @Schema(description = "Nombre de la subespecialidad")
    private String subespecialidadNombre;

    @Schema(description = "Fecha de atención")
    private LocalDate fecha;

    @Schema(description = "Día de la semana (1=Lunes, 7=Domingo)")
    private Short diaSemana;

    @Schema(description = "Hora de inicio de atención")
    private LocalTime horaInicio;

    @Schema(description = "Hora de fin de atención")
    private LocalTime horaFin;

    @Schema(description = "Capacidad máxima de pacientes para este día")
    private Integer capacidadMaxima;

    @Schema(description = "Cantidad de cupos actualmente ocupados")
    private Integer cuposOcupados;

    @Schema(description = "Cantidad de cupos disponibles")
    private Integer cuposDisponibles;

    @Schema(description = "Indica si todavía existen cupos libres para reservar")
    private Boolean disponible;

    public static CupoDiarioResponseDTO fromEntity(CupoDiario entity) {
        var horario = entity.getSubespecialidadHorario();
        int disponibles = Math.max(0, entity.getCapacidadMaxima() - entity.getCuposOcupados());
        return CupoDiarioResponseDTO.builder()
                .id(entity.getId())
                .subespecialidadHorarioId(horario.getId())
                .subespecialidadId(horario.getSubespecialidad().getId())
                .subespecialidadNombre(horario.getSubespecialidad().getNombre())
                .fecha(entity.getFecha())
                .diaSemana(horario.getDiaSemana())
                .horaInicio(horario.getHoraInicio())
                .horaFin(horario.getHoraFin())
                .capacidadMaxima(entity.getCapacidadMaxima())
                .cuposOcupados(entity.getCuposOcupados())
                .cuposDisponibles(disponibles)
                .disponible(disponibles > 0)
                .build();
    }
}
