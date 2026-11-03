package com.hro.system.turnoestacion.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgendarProximaVisitaRequestDTO {

    @NotNull(message = "La fecha de la próxima visita es obligatoria")
    private LocalDate fecha;
}
