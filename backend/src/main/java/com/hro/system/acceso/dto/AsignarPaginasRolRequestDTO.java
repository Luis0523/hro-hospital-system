package com.hro.system.acceso.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsignarPaginasRolRequestDTO {

    @NotNull(message = "La lista de páginas es obligatoria (puede ser vacía)")
    @Builder.Default
    private List<String> paginas = new ArrayList<>();
}
