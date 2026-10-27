package com.hro.system.archivo.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** Cantidades del registro diario del Cuaderno Rojo. La fecha va en la ruta. */
@Data
public class GuardarCuadernoRojoRequestDTO {

    @NotNull(message = "Los egresos hospitalarios son obligatorios")
    @Min(value = 0, message = "Los egresos hospitalarios no pueden ser negativos")
    private Integer egresosHospitalarios;

    @NotNull(message = "Los sobres de emergencia son obligatorios")
    @Min(value = 0, message = "Los sobres de emergencia no pueden ser negativos")
    private Integer sobresEmergencia;

    @NotNull(message = "Los sobres sellados son obligatorios")
    @Min(value = 0, message = "Los sobres sellados no pueden ser negativos")
    private Integer sobresSellados;

    @NotNull(message = "El TIA es obligatorio")
    @Min(value = 0, message = "El TIA no puede ser negativo")
    private Integer tia;
}
