package com.hro.system.agenda.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Conflicto devuelto (HTTP 409) cuando se intenta bloquear una fecha con citas
 * activas sin forzar. Permite al frontend mostrar las citas afectadas y pedir
 * confirmación explícita antes de reintentar con {@code forzar = true}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiaNoLaborableConflictoDTO {
    private String codigo;
    private LocalDate fecha;
    private long totalCitas;
    private List<CitaAfectadaDTO> citas;
}
