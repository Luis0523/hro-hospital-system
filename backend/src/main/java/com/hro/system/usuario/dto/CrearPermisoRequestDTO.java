package com.hro.system.usuario.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrearPermisoRequestDTO {

    @NotNull(message = "El ID del usuario es obligatorio")
    private Long usuarioId;

    @NotNull(message = "El ID de la subespecialidad es obligatorio")
    private Long subespecialidadId;

    @NotBlank(message = "El tipo de permiso es obligatorio")
    private String tipoPermiso;
}
