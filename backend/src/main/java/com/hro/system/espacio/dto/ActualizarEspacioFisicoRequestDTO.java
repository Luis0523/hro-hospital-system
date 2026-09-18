package com.hro.system.espacio.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Solicitud para actualizar un espacio físico")
public class ActualizarEspacioFisicoRequestDTO {

    @NotBlank(message = "El número de la sala es obligatorio")
    @Size(max = 30, message = "El número no puede exceder 30 caracteres")
    private String numero;

    @NotNull(message = "El nivel es obligatorio")
    @Min(value = 1, message = "El nivel debe ser al menos 1")
    private Short nivel;

    @Min(value = 1, message = "La capacidad de camillas debe ser al menos 1")
    private Integer capacidadCamillas;

    private String coordenadasPlano;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 150, message = "El nombre no puede exceder 150 caracteres")
    private String nombre;

    @Size(max = 150, message = "La ubicación no puede exceder 150 caracteres")
    private String ubicacion;

    @NotNull(message = "El estado activo es obligatorio")
    private Boolean activo;
}
