package com.hro.system.libro.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LibroCitasDiaRequestDTO {

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate fecha;

    @Min(value = 0, message = "No puede ser negativo")
    @Builder.Default
    private Integer egresosHospitalarios = 0;

    @Min(value = 0, message = "No puede ser negativo")
    @Builder.Default
    private Integer sobresEmergencia = 0;

    @Min(value = 0, message = "No puede ser negativo")
    @Builder.Default
    private Integer sobresSellados = 0;

    @Min(value = 0, message = "No puede ser negativo")
    @Builder.Default
    private Integer tia = 0;

    private String observaciones;

    @Valid
    @Builder.Default
    private List<LibroCitasEspecialidadRequestDTO> especialidades = new ArrayList<>();
}
