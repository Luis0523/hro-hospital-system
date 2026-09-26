package com.hro.system.archivo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrearUbicacionArchivoRequestDTO {

    @NotBlank(message = "El pasillo es obligatorio")
    @Size(max = 20, message = "El pasillo no puede superar 20 caracteres")
    private String pasillo;

    @NotBlank(message = "El estante es obligatorio")
    @Size(max = 20, message = "El estante no puede superar 20 caracteres")
    private String estante;

    @Size(max = 20, message = "La balda no puede superar 20 caracteres")
    private String balda;

    @Size(max = 150, message = "La descripción no puede superar 150 caracteres")
    private String descripcion;
}
