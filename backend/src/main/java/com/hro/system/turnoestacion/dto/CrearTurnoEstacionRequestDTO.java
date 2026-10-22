package com.hro.system.turnoestacion.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class CrearTurnoEstacionRequestDTO {

    @NotNull(message = "La estación es obligatoria")
    private Long estacionId;

    @NotNull(message = "La especialidad es obligatoria")
    private Long especialidadId;

    private LocalDate fecha;

    /** Clínica destino opcional. Se puede asignar después si no viene. */
    private UUID espacioFisicoId;

    private UUID pacienteId;

    @Size(max = 30, message = "El número de expediente no puede superar 30 caracteres")
    private String numeroExpediente;

    @Size(max = 200, message = "El nombre del paciente no puede superar 200 caracteres")
    private String pacienteNombre;

    private Long citaId;
}
