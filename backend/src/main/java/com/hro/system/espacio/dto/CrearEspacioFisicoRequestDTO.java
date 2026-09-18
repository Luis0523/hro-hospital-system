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
@Schema(description = "Solicitud para crear un espacio físico (sala/consultorio)")
public class CrearEspacioFisicoRequestDTO {

    @NotBlank(message = "El número de la sala es obligatorio")
    @Size(max = 30, message = "El número no puede exceder 30 caracteres")
    @Schema(description = "Identificador de la sala/consultorio", example = "101")
    private String numero;

    @NotNull(message = "El nivel es obligatorio")
    @Min(value = 1, message = "El nivel debe ser al menos 1")
    @Schema(description = "Nivel o piso del espacio", example = "1")
    private Short nivel;

    @Min(value = 1, message = "La capacidad de camillas debe ser al menos 1")
    @Builder.Default
    @Schema(description = "Cantidad de espacios de atención simultánea", example = "1")
    private Integer capacidadCamillas = 1;

    @Schema(description = "Referencia a la zona/polígono dentro del SVG del nivel", example = "{\"zona\":\"A-101\"}")
    private String coordenadasPlano;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 150, message = "El nombre no puede exceder 150 caracteres")
    @Schema(description = "Nombre descriptivo del espacio", example = "Sala 101")
    private String nombre;

    @Size(max = 150, message = "La ubicación no puede exceder 150 caracteres")
    @Schema(description = "Descripción de ubicación", example = "Edificio Consulta Externa, Nivel 1")
    private String ubicacion;
}
