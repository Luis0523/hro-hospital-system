package com.hro.system.archivo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IniciarCicloRequestDTO {

    @NotNull(message = "El ID del expediente es obligatorio")
    private UUID expedienteId;

    @NotNull(message = "El ID de la cita es obligatorio")
    private Long citaId;
}
