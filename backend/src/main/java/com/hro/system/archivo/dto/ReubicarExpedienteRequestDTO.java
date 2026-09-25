package com.hro.system.archivo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReubicarExpedienteRequestDTO {

    @NotNull(message = "La ubicación base es obligatoria")
    private Long ubicacionBaseId;
}
