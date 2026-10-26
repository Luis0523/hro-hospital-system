package com.hro.system.estacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicaFijaEstacionResponseDTO {
    private Long id;
    private Long estacionId;
    private Long especialidadId;
    private String especialidadNombre;
    private UUID espacioFisicoId;
    private String espacioNumero;
    private String espacioNombre;
    private Short nivel;
}
