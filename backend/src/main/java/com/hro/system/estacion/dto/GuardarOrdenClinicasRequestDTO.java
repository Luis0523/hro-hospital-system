package com.hro.system.estacion.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuardarOrdenClinicasRequestDTO {

    /** Clínicas en el orden deseado (la primera será la primera en mostrarse). */
    @NotNull(message = "El orden de clínicas es obligatorio")
    @Builder.Default
    private List<UUID> espacioFisicoIds = new ArrayList<>();
}
