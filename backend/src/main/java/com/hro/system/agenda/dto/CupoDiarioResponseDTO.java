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
@Schema(description = "Respuesta con detalle de cupos diarios y disponibilidad de atención")
public class CupoDiarioResponseDTO {

    @Schema(description = "ID del registro de cupo diario", example = "10")
    private UUID id;

    @Schema(description = "ID de la programación médico-subespecialidad", example = "3")
    private UUID medicoSubespecialidadId;

    @Schema(description = "ID del médico", example = "5")
    private UUID medicoId;

    @Schema(description = "Nombre completo del médico", example = "Dra. Sofía Reyes")
    private String medicoNombre;

    @Schema(description = "ID de la subespecialidad", example = "2")
    private Long subespecialidadId;

    @Schema(description = "Nombre de la subespecialidad", example = "Cardiología Clínica")
    private String subespecialidadNombre;

    @Schema(description = "Fecha de atención", example = "2026-09-15")
    private LocalDate fecha;

    @Schema(description = "Día de la semana (1=Lunes, 7=Domingo)", example = "2")
    private Short diaSemana;

    @Schema(description = "Hora de inicio de atención", example = "07:00:00")
    private LocalTime horaInicio;

    @Schema(description = "Hora de fin de atención", example = "12:00:00")
    private LocalTime horaFin;

    @Schema(description = "Capacidad máxima de pacientes para este día", example = "20")
    private Integer capacidadMaxima;

    @Schema(description = "Cantidad de cupos actualmente ocupados", example = "14")
    private Integer cuposOcupados;

    @Schema(description = "Cantidad de cupos disponibles", example = "6")
    private Integer cuposDisponibles;

    @Schema(description = "Indica si todavía existen cupos libres para reservar", example = "true")
    private Boolean disponible;

    public static CupoDiarioResponseDTO fromEntity(CupoDiario entity) {
        int disponibles = Math.max(0, entity.getCapacidadMaxima() - entity.getCuposOcupados());
        return CupoDiarioResponseDTO.builder()
                .id(entity.getId())
                .medicoSubespecialidadId(entity.getMedicoSubespecialidad().getId())
                .medicoId(entity.getMedicoSubespecialidad().getMedico().getId())
                .medicoNombre(entity.getMedicoSubespecialidad().getMedico().getNombres())
                .subespecialidadId(entity.getMedicoSubespecialidad().getSubespecialidad().getId())
                .subespecialidadNombre(entity.getMedicoSubespecialidad().getSubespecialidad().getNombre())
                .fecha(entity.getFecha())
                .diaSemana(entity.getMedicoSubespecialidad().getDiaSemana())
                .horaInicio(entity.getMedicoSubespecialidad().getHoraInicio())
                .horaFin(entity.getMedicoSubespecialidad().getHoraFin())
                .capacidadMaxima(entity.getCapacidadMaxima())
                .cuposOcupados(entity.getCuposOcupados())
                .cuposDisponibles(disponibles)
                .disponible(disponibles > 0)
                .build();
    }
}
