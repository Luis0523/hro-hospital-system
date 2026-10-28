package com.hro.system.turnoestacion.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActualizarTipoRegistroRequestDTO {

    /** presentacion, privado_libertad o null para quitar la marca. */
    @Size(max = 30, message = "El tipo de registro no puede superar 30 caracteres")
    private String tipoRegistro;
}
