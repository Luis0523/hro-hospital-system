package com.hro.system.libro.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Una cita capturada del libro: expediente, fecha y subespecialidad.
 * {@code pacienteId} es opcional (si falta, el backend resuelve por número de expediente).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LibroCitasExpedienteItemDTO {

    @NotBlank(message = "El número de expediente es obligatorio")
    private String numeroExpediente;

    private UUID pacienteId;

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate fecha;

    @NotNull(message = "La subespecialidad es obligatoria")
    private Long subespecialidadId;
}
