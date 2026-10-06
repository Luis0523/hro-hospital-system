package com.hro.system.libro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Número de expedientes esperados para una fecha, desglosado por subespecialidad.
 * <p>
 * Fase 1: la fuente es el libro digitado ({@code LIBRO}). En una fase posterior se
 * precargará desde la API de Registro Médico ({@code REGISTRO_MEDICO}).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpedientesEsperadosDTO {
    private LocalDate fecha;
    private String fuente;
    private Integer totalExpedientes;
    private List<LibroCitasEspecialidadResponseDTO> items;
}
