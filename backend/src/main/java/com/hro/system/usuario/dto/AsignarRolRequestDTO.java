package com.hro.system.usuario.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsignarRolRequestDTO {

    @NotBlank(message = "El rol es obligatorio")
    private String rolPrincipal;
}
