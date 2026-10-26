package com.hro.system.estacion.dto;

import jakarta.validation.Valid;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class AsignarClinicasFijasRequestDTO {
    @Valid
    private List<ClinicaFijaEstacionRequestDTO> asignaciones = new ArrayList<>();
}
